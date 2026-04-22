// Cloudflare Worker entry point with Hono
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from 'hono/adapter';

// Domain validation helpers
// import { parseGiftCode, parseNonEmptyString } from '../domain/types';

// Infrastructure
import { createTiDBConnection } from '../infrastructure/tidb/connection';
import { createGiftRepository } from '../infrastructure/tidb/gift-repository';
import { createSubmissionRepository } from '../infrastructure/tidb/submission-repository';
import { createFormRepository } from '../infrastructure/tidb/form-repository';
import { createRealClock, createUuidIdGenerator } from '../infrastructure/utils';
import { createBcryptAuth } from '../infrastructure/admin-auth/simple-password';

// Application
import { getFormSnapshot } from '../application/get-form-snapshot';
import { submitGiftSelection } from '../application/submit-gift-selection';

// Rate limiting store (in-memory for simplicity - in production, use KV or Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware
function rateLimit(maxRequests: number, windowMs: number) {
  return async (c: any, next: any) => {
    const ip = c.req.header('cf-connecting-ip') || 'unknown';
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    record.count++;
    return next();
  };
}

// Admin authentication middleware
function requireAuth() {
  return async (c: any, next: any) => {
    const authHeader = c.req.header('authorization');
    const ip = c.req.header('cf-connecting-ip') || 'unknown';
    const requestId = c.req.header('x-request-id');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logAuditEvent('AUTH_MISSING_TOKEN', { ip }, ip, requestId);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    if (token !== 'admin_token') {
      logAuditEvent('AUTH_INVALID_TOKEN', { ip }, ip, requestId);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return next();
  };
}

// Audit logging helper
function logAuditEvent(event: string, data: any, ip?: string, requestId?: string) {
  console.log(JSON.stringify({
    level: 'audit',
    timestamp: new Date().toISOString(),
    event,
    ip,
    requestId,
    ...data,
  }));
}

// Structured logging helper
function logError(message: string, error: any, requestId?: string) {
  console.log(JSON.stringify({
    level: 'error',
    timestamp: new Date().toISOString(),
    message,
    requestId,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : String(error),
  }));
}

function logWarn(message: string, data: any = {}, requestId?: string) {
  console.log(JSON.stringify({
    level: 'warn',
    timestamp: new Date().toISOString(),
    message,
    requestId,
    ...data,
  }));
}

// CSRF protection helper
function generateCSRFToken(): string {
  return crypto.randomUUID();
}

function validateCSRFToken(token: string | null, sessionToken: string | null): boolean {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}

// Input sanitization helper
function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  // Remove null bytes and control characters except newlines and tabs
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Trim whitespace
  sanitized = sanitized.trim();
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

function validateNickname(input: string): string | null {
  const sanitized = sanitizeString(input, 50);
  if (sanitized.length < 1) return null;
  // Allow letters, numbers, spaces, and common punctuation
  if (!/^[a-zA-Z0-9\s\-_.]+$/.test(sanitized)) return null;
  return sanitized;
}

function validateGiftId(input: string): string | null {
  const sanitized = sanitizeString(input, 100);
  if (sanitized.length < 1) return null;
  // Allow UUID format
  if (!/^[a-f0-9-]+$/i.test(sanitized)) return null;
  return sanitized;
}

// Type definitions for Cloudflare bindings
interface Env {
  TIDB_CONNECTION_STRING: string;
  FORM_DO: DurableObjectNamespace;
  ASSETS: Fetcher;  // Workers Assets binding for static files
  ENVIRONMENT: string;
  ADMIN_PASSWORD_HASH: string;
}

const app = new Hono<{ Bindings: Env }>();

// Request ID middleware
app.use('*', async (c, next) => {
  const requestId = c.req.header('x-request-id') || crypto.randomUUID();
  c.header('x-request-id', requestId);
  await next();
});

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/api/health', async (c) => {
  const bindings = env(c);
  const requestId = c.req.header('x-request-id');

  const health = {
    status: 'ok' as 'ok' | 'degraded' | 'unhealthy',
    environment: bindings.ENVIRONMENT,
    checks: {
      database: 'ok' as 'ok' | 'error',
    },
    timestamp: new Date().toISOString(),
  };

  // Check database connectivity
  try {
    const db = createTiDBConnection(bindings.TIDB_CONNECTION_STRING);
    await db.execute('SELECT 1');
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
    logError('Health check: database connection failed', error, requestId);
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  return c.json(health, statusCode);
});

// Bootstrap endpoint - Phase 2
app.get('/api/forms/:slug/bootstrap', async (c) => {
  const slug = c.req.param('slug');
  const bindings = env(c);
  const requestId = c.req.header('x-request-id');

  try {
    // Check if connection string is set
    if (!bindings.TIDB_CONNECTION_STRING) {
      logError('TIDB_CONNECTION_STRING not set', new Error('Missing connection string'), requestId);
      return c.json({ 
        error: 'Database configuration error. Please set TIDB_CONNECTION_STRING secret.' 
      }, 500);
    }

    // Wire up dependencies
    const db = createTiDBConnection(bindings.TIDB_CONNECTION_STRING);
    const giftRepo = createGiftRepository(db);
    const submissionRepo = createSubmissionRepository(db);
    const formRepo = createFormRepository(db);

    // Generate and set CSRF token in response header
    const csrfToken = generateCSRFToken();
    c.header('X-CSRF-Token', csrfToken);

    // Call use case
    const result = await getFormSnapshot(slug, giftRepo, submissionRepo, formRepo);

    if (!result.success) {
      logError('Bootstrap failed', result.error, requestId);
      return c.json({ error: result.error.message }, 400);
    }

    return c.json(result.data);
  } catch (error) {
    logError('Bootstrap error', error, requestId);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Submit endpoint - Phase 2 (with rate limiting)
app.post('/api/forms/:slug/submissions', rateLimit(10, 60000), async (c) => {
  const slug = c.req.param('slug');
  const bindings = env(c);
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const requestId = c.req.header('x-request-id');

  try {
    // CSRF validation
    const csrfToken = c.req.header('X-CSRF-Token') || null;
    const sessionToken = c.req.header('Cookie')?.match(/csrf_token=([^;]+)/)?.[1] || null;

    if (!validateCSRFToken(csrfToken, sessionToken)) {
      logWarn('CSRF validation failed', { ip }, requestId);
      return c.json({ error: 'Invalid CSRF token' }, 403);
    }

    const body = await c.req.json();
    const { nickname, giftId } = body;

    if (!nickname || !giftId) {
      return c.json({ error: 'Missing required fields: nickname and giftId' }, 400);
    }

    // Validate and sanitize inputs
    const validatedNickname = validateNickname(nickname);
    const validatedGiftId = validateGiftId(giftId);

    if (!validatedNickname) {
      return c.json({ error: 'Invalid nickname: must be 1-50 characters, letters, numbers, spaces, hyphens, underscores, or periods only' }, 400);
    }

    if (!validatedGiftId) {
      return c.json({ error: 'Invalid gift ID format' }, 400);
    }

    // Wire up dependencies
    const db = createTiDBConnection(bindings.TIDB_CONNECTION_STRING);
    const giftRepo = createGiftRepository(db);
    const submissionRepo = createSubmissionRepository(db);
    const formRepo = createFormRepository(db);
    const clock = createRealClock();
    const idGenerator = createUuidIdGenerator();

    // Call use case
    const result = await submitGiftSelection(
      slug,
      { nickname: validatedNickname, giftId: validatedGiftId },
      giftRepo,
      submissionRepo,
      formRepo,
      clock,
      idGenerator
    );

    if (!result.success) {
      logAuditEvent('SUBMIT_FAILED', { slug, nickname, giftId, error: result.error.message }, ip, requestId);
      return c.json({ error: result.error.message }, 400);
    }

    // Broadcast gift selection to Durable Object for realtime updates
    try {
      const formResult = await formRepo.findBySlug(slug);
      if (formResult.success && formResult.data) {
        const formDO = bindings.FORM_DO.get(bindings.FORM_DO.idFromName(formResult.data.id));
        await formDO.fetch(new Request(`http://localhost/broadcast`, {
          method: 'POST',
          body: JSON.stringify({
            type: 'gift_selected',
            giftId,
            nickname,
          }),
        }));
      }
    } catch (broadcastError) {
      logError('Failed to broadcast to Durable Object', broadcastError, requestId);
      // Don't fail the request if broadcast fails
    }

    logAuditEvent('SUBMIT_SUCCESS', { slug, nickname, giftId, submissionId: result.data?.id }, ip, requestId);
    return c.json({ success: true, submission: result.data });
  } catch (error) {
    logError('Submit error', error, requestId);
    logAuditEvent('SUBMIT_ERROR', { slug, error: String(error) }, ip, requestId);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// WebSocket upgrade for realtime - Phase 3
app.get('/ws/forms/:formId', async (c) => {
  const formId = c.req.param('formId');
  const bindings = env(c);

  // Create or get Durable Object stub for this form
  const formDO = bindings.FORM_DO.get(bindings.FORM_DO.idFromName(formId));

  // Pass the request to the Durable Object for WebSocket handling
  return formDO.fetch(c.req.raw);
});

// Admin routes - Phase 4
// Admin authentication
app.post('/api/admin/auth', async (c) => {
  const bindings = env(c);
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const requestId = c.req.header('x-request-id');

  try {
    const body = await c.req.json();
    const { password } = body;

    const auth = createBcryptAuth();
    const result = await auth.verifyPassword(password, bindings.ADMIN_PASSWORD_HASH);
    if (result.success && result.data) {
      logAuditEvent('ADMIN_LOGIN_SUCCESS', { ip }, ip, requestId);
      return c.json({ success: true, token: 'admin_token' }); // Simple token for now
    } else {
      logAuditEvent('ADMIN_LOGIN_FAILED', { ip }, ip, requestId);
      return c.json({ error: 'Invalid password' }, 401);
    }
  } catch (error) {
    logError('Auth error', error, requestId);
    logAuditEvent('ADMIN_LOGIN_ERROR', { ip, error: String(error) }, ip, requestId);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
// List gifts for a form
app.get('/api/admin/forms/:formId/gifts', requireAuth(), async (c) => {
  const formId = c.req.param('formId');
  const bindings = env(c);
  const requestId = c.req.header('x-request-id');

  try {
    const db = createTiDBConnection(bindings.TIDB_CONNECTION_STRING);
    const giftRepo = createGiftRepository(db);
    const result = await giftRepo.findByFormId(formId);

    if (result.success) {
      return c.json({ success: true, gifts: result.data });
    } else {
      return c.json({ error: result.error.message }, 400);
    }
  } catch (error) {
    logError('List gifts error', error, requestId);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create gift
app.post('/api/admin/forms/:formId/gifts', requireAuth(), async (c) => {
  const formId = c.req.param('formId');
  const bindings = env(c);
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const requestId = c.req.header('x-request-id');

  try {
    const body = await c.req.json();
    const { name, code, description, imageKey, status = 'available', sortOrder = 0 } = body;

    // Validate required fields
    if (!name || !code) {
      return c.json({ error: 'Missing required fields: name and code' }, 400);
    }

    // Validate and sanitize inputs
    const sanitizedName = sanitizeString(name, 200);
    const sanitizedCode = sanitizeString(code, 50);
    const sanitizedDescription = sanitizeString(description || '', 1000);
    const sanitizedImageKey = imageKey ? sanitizeString(imageKey, 500) : null;

    if (sanitizedName.length === 0) {
      return c.json({ error: 'Invalid name: must be a non-empty string' }, 400);
    }

    if (sanitizedCode.length === 0) {
      return c.json({ error: 'Invalid code: must be a non-empty string' }, 400);
    }

    if (status !== 'available' && status !== 'selected' && status !== 'inactive') {
      return c.json({ error: 'Invalid status: must be available, selected, or inactive' }, 400);
    }

    if (typeof sortOrder !== 'number' || sortOrder < 0) {
      return c.json({ error: 'Invalid sortOrder: must be a non-negative number' }, 400);
    }

    const db = createTiDBConnection(bindings.TIDB_CONNECTION_STRING);
    const giftRepo = createGiftRepository(db);
    const idGenerator = createUuidIdGenerator();
    const clock = createRealClock();

    const now = clock.now();
    const gift = {
      id: idGenerator.generateGiftId(),
      formId,
      code: sanitizedCode as any,
      name: sanitizedName as any,
      description: sanitizedDescription,
      imageKey: sanitizedImageKey,
      status: status as 'available' | 'selected' | 'inactive',
      sortOrder,
      selectedSubmissionId: null,
      version: 1,
      createdAt: now as any,
      updatedAt: now as any,
    };
    const result = await giftRepo.save(gift);

    if (result.success) {
      logAuditEvent('GIFT_CREATED', { formId, giftId: gift.id, name: sanitizedName, code: sanitizedCode }, ip, requestId);
      return c.json({ success: true, gift: result.data });
    } else {
      logAuditEvent('GIFT_CREATE_FAILED', { formId, name: sanitizedName, code: sanitizedCode, error: result.error.message }, ip, requestId);
      return c.json({ error: result.error.message }, 400);
    }
  } catch (error) {
    logError('Create gift error', error, requestId);
    logAuditEvent('GIFT_CREATE_ERROR', { formId, error: String(error) }, ip, requestId);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update gift
app.put('/api/admin/forms/:formId/gifts/:giftId', requireAuth(), async (c) => {
  const giftId = c.req.param('giftId');
  const bindings = env(c);
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const requestId = c.req.header('x-request-id');

  try {
    const body = await c.req.json();
    const { name, code, description, imageKey, status, sortOrder } = body;

    const db = createTiDBConnection(bindings.TIDB_CONNECTION_STRING);
    const giftRepo = createGiftRepository(db);

    const existingResult = await giftRepo.findById(giftId as any);
    if (!existingResult.success || !existingResult.data) {
      return c.json({ error: 'Gift not found' }, 404);
    }

    const gift = {
      ...existingResult.data,
      name: name ?? existingResult.data.name,
      code: code ?? existingResult.data.code,
      description: description ?? existingResult.data.description,
      imageKey: imageKey ?? existingResult.data.imageKey,
      status: status ?? existingResult.data.status,
      sortOrder: sortOrder ?? existingResult.data.sortOrder,
    };
    const result = await giftRepo.save(gift);

    if (result.success) {
      logAuditEvent('GIFT_UPDATED', { giftId, changes: body }, ip, requestId);
      return c.json({ success: true, gift: result.data });
    } else {
      logAuditEvent('GIFT_UPDATE_FAILED', { giftId, error: result.error.message }, ip, requestId);
      return c.json({ error: result.error.message }, 400);
    }
  } catch (error) {
    logError('Update gift error', error, requestId);
    logAuditEvent('GIFT_UPDATE_ERROR', { giftId, error: String(error) }, ip, requestId);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete gift
app.delete('/api/admin/forms/:formId/gifts/:giftId', requireAuth(), async (c) => {
  const giftId = c.req.param('giftId');
  const bindings = env(c);
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const requestId = c.req.header('x-request-id');

  try {
    const db = createTiDBConnection(bindings.TIDB_CONNECTION_STRING);
    const giftRepo = createGiftRepository(db);

    const result = await giftRepo.delete(giftId as any);

    if (result.success) {
      logAuditEvent('GIFT_DELETED', { giftId }, ip, requestId);
      return c.json({ success: true });
    } else {
      logAuditEvent('GIFT_DELETE_FAILED', { giftId, error: result.error.message }, ip, requestId);
      return c.json({ error: result.error.message }, 400);
    }
  } catch (error) {
    logError('Delete gift error', error, requestId);
    logAuditEvent('GIFT_DELETE_ERROR', { giftId, error: String(error) }, ip, requestId);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// List submissions
app.get('/api/admin/forms/:formId/submissions', requireAuth(), async (c) => {
  const formId = c.req.param('formId');
  const bindings = env(c);
  const requestId = c.req.header('x-request-id');

  // Parse pagination parameters
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '50', 10);

  // Validate pagination parameters
  if (page < 1) {
    return c.json({ error: 'Page must be at least 1' }, 400);
  }
  if (limit < 1 || limit > 100) {
    return c.json({ error: 'Limit must be between 1 and 100' }, 400);
  }

  try {
    const db = createTiDBConnection(bindings.TIDB_CONNECTION_STRING);
    const submissionRepo = createSubmissionRepository(db);
    const result = await submissionRepo.findByFormIdPaginated(formId, page, limit);

    if (result.success) {
      const { submissions, total } = result.data;
      const totalPages = Math.ceil(total / limit);

      return c.json({
        success: true,
        submissions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } else {
      return c.json({ error: result.error.message }, 400);
    }
  } catch (error) {
    logError('List submissions error', error, requestId);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Export submissions as CSV
app.get('/api/admin/forms/:formId/submissions/export', requireAuth(), async (c) => {
  const formId = c.req.param('formId');
  const bindings = env(c);
  const requestId = c.req.header('x-request-id');

  try {
    const db = createTiDBConnection(bindings.TIDB_CONNECTION_STRING);
    const submissionRepo = createSubmissionRepository(db);
    const result = await submissionRepo.findByFormId(formId);

    if (!result.success) {
      return c.json({ error: result.error.message }, 400);
    }

    // Generate CSV
    const headers = ['ID', 'Nickname', 'Gift ID', 'Gift Name', 'Status', 'Created At'];
    const rows = result.data.map(s => [
      s.id,
      s.nickname,
      s.giftId,
      s.giftNameSnapshot,
      s.status,
      s.createdAt,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=submissions-${formId}-${new Date().toISOString().split('T')[0]}.csv`,
      },
    });
  } catch (error) {
    logError('Export submissions error', error, requestId);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Image upload endpoint - Images are now served from assets
// To add new images, place them in public/images/ and rebuild
app.post('/api/admin/images/upload', requireAuth(), async (c) => {
  return c.json({ 
    error: 'Image upload disabled. Images are served from assets. Place images in public/images/ and rebuild.' 
  }, 501);
});

// Serve static assets for non-API routes (SPA fallback)
app.get('*', async (c) => {
  const bindings = env(c);
  
  // Try to serve static asset from R2 bucket binding
  try {
    const url = new URL(c.req.url);
    const path = url.pathname;
    
    // For SPA: serve index.html for non-asset routes
    if (!path.includes('.') || path.endsWith('.html')) {
      const indexResponse = await bindings.ASSETS.fetch(new Request(`${url.origin}/index.html`));
      if (indexResponse.ok) {
        return new Response(await indexResponse.text(), {
          headers: { 'Content-Type': 'text/html' },
        });
      }
    }
    
    // Try to get the asset
    const assetPath = path.slice(1) || 'index.html';
    const assetResponse = await bindings.ASSETS.fetch(new Request(`${url.origin}/${assetPath}`));
    if (assetResponse.ok) {
      // Determine content type
      const ext = path.split('.').pop() || '';
      const contentTypes: Record<string, string> = {
        'html': 'text/html',
        'js': 'application/javascript',
        'css': 'text/css',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'woff': 'font/woff',
        'woff2': 'font/woff2',
      };
      
      return new Response(await assetResponse.text(), {
        headers: { 
          'Content-Type': contentTypes[ext] || 'application/octet-stream' 
        },
      });
    }
    
    // Fallback to index.html for SPA routing
    const fallbackResponse = await bindings.ASSETS.fetch(new Request(`${url.origin}/index.html`));
    if (fallbackResponse.ok) {
      return new Response(await fallbackResponse.text(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }
    
    return c.json({ error: 'Not found' }, 404);
  } catch (error) {
    logError('Asset serving error', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Export Durable Object
export { FormDO } from '../infrastructure/durable-object/form-do';

// Export Hono app as default
export default app;
