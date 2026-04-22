// API client for communicating with Cloudflare backend
const API_BASE = '/api';

export interface Gift {
  id: string;
  formId: string;
  code: string;
  name: string;
  description: string;
  imageKey: string | null;
  sortOrder: number;
  status: 'available' | 'selected' | 'inactive';
  selectedSubmissionId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormSnapshot {
  form: {
    id: string;
    slug: string;
    title: string;
    status: 'open' | 'closed';
  };
  gifts: {
    available: readonly Gift[];
    selected: readonly Gift[];
    inactive: readonly Gift[];
  };
  stats: {
    totalGifts: number;
    availableGifts: number;
    selectedGifts: number;
    inactiveGifts: number;
    totalSubmissions: number;
  };
  revision: number;
  websocketEndpoint: string;
}

export interface Submission {
  id: string;
  formId: string;
  giftId: string;
  nickname: string;
  giftNameSnapshot: string;
  createdAt: string;
  status: 'active' | 'cancelled';
}

export class ApiClient {
  async getFormSnapshot(slug: string): Promise<FormSnapshot> {
    const response = await fetch(`${API_BASE}/forms/${slug}/bootstrap`);
    if (!response.ok) {
      throw new Error(`Failed to fetch form snapshot: ${response.statusText}`);
    }
    return response.json();
  }

  async submitSelection(slug: string, nickname: string, giftId: string): Promise<Submission> {
    const response = await fetch(`${API_BASE}/forms/${slug}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, giftId }),
    });
    
    const data = await response.json() as { success: boolean; submission?: Submission; error?: string };
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit selection');
    }
    
    if (!data.success || !data.submission) {
      throw new Error('Failed to submit selection');
    }
    
    return data.submission;
  }
}

export const apiClient = new ApiClient();
