// Durable Object for form coordination and realtime
// One DO per form instance for WebSocket coordination

export interface FormDurableObjectState {
  gifts: Map<string, { status: string; selectedBy: string | null }>;
  submissions: Map<string, { giftId: string; nickname: string }>;
  formStatus: 'open' | 'closed';
  revision: number;
}

// Structured logging helpers
function logDO(level: 'info' | 'error' | 'warn', message: string, data: any = {}) {
  console.log(JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    source: 'FormDO',
    message,
    ...data,
  }));
}

export class FormDO implements DurableObject {
  private state: DurableObjectState;
  private connectedClients: Set<WebSocket> = new Set();
  private revision: number = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(state: DurableObjectState, env: unknown) {
    this.state = state;
    this.startHeartbeat();
  }

  private startHeartbeat() {
    // Send periodic pings to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      const deadClients: WebSocket[] = [];
      this.connectedClients.forEach(client => {
        try {
          client.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
        } catch (error) {
          deadClients.push(client);
        }
      });

      // Remove dead clients
      deadClients.forEach(client => {
        this.connectedClients.delete(client);
        logDO('warn', 'Removed dead WebSocket client', { remainingClients: this.connectedClients.size });
      });
    }, 30000); // Every 30 seconds
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      try {
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        await server.accept();

        // Store the client connection
        this.connectedClients.add(server);
        logDO('info', 'WebSocket client connected', { totalClients: this.connectedClients.size });

        // Send initial state
        try {
          server.send(JSON.stringify({
            type: 'connected',
            revision: this.revision,
            timestamp: new Date().toISOString(),
          }));
        } catch (error) {
          logDO('error', 'Failed to send initial state to client', { error: String(error) });
          this.connectedClients.delete(server);
          return new Response('Failed to initialize connection', { status: 500 });
        }

        // Handle client disconnect
        server.addEventListener('close', () => {
          this.connectedClients.delete(server);
          logDO('info', 'WebSocket client disconnected', { remainingClients: this.connectedClients.size });
        });

        // Handle client errors
        server.addEventListener('error', (error) => {
          logDO('error', 'WebSocket client error', { error: String(error) });
          this.connectedClients.delete(server);
        });

        // Handle client messages
        server.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data as string);
            logDO('info', 'Received message from client', { messageType: message.type });
          } catch (error) {
            logDO('error', 'Failed to parse client message', { error: String(error) });
          }
        });

        return new Response(null, {
          status: 101,
          webSocket: client,
        });
      } catch (error) {
        logDO('error', 'WebSocket upgrade failed', { error: String(error) });
        return new Response('WebSocket upgrade failed', { status: 500 });
      }
    }

    // Broadcast gift selection
    if (url.pathname === '/broadcast') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      try {
        const body = await request.json() as { type: 'gift_selected'; giftId: string; nickname: string };

        this.revision++;

        const message = JSON.stringify({
          type: 'gift_selected',
          giftId: body.giftId,
          nickname: body.nickname,
          revision: this.revision,
          timestamp: new Date().toISOString(),
        });

        let successCount = 0;
        let failureCount = 0;

        // Broadcast to all connected clients
        this.connectedClients.forEach(client => {
          try {
            client.send(message);
            successCount++;
          } catch (error) {
            logDO('error', 'Failed to broadcast to client', { error: String(error) });
            this.connectedClients.delete(client);
            failureCount++;
          }
        });

        logDO('info', 'Broadcast completed', {
          totalClients: this.connectedClients.size + failureCount,
          successCount,
          failureCount,
          revision: this.revision,
        });

        return new Response(JSON.stringify({ success: true, revision: this.revision }));
      } catch (error) {
        logDO('error', 'Broadcast failed', { error: String(error) });
        return new Response('Broadcast failed', { status: 500 });
      }
    }

    return new Response('Not found', { status: 404 });
  }
}
