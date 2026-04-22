// API client for communicating with the backend

// Types for API responses - using plain types (not branded) since API returns JSON
export interface ApiGift {
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
    available: ApiGift[];
    selected: ApiGift[];
    inactive: ApiGift[];
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

export interface PaginatedSubmissions {
  submissions: Submission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Gift status type for admin operations
export type GiftStatus = 'available' | 'selected' | 'inactive';

// API error type
export interface ApiError {
  error: string;
}

// Base fetch with error handling
async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Request failed' };
    }

    return { success: true, data };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Network error' 
    };
  }
}

// Public API (no auth required)
export const publicApi = {
  // Get form snapshot for bootstrap
  async getFormSnapshot(slug: string): Promise<{ success: true; data: FormSnapshot } | { success: false; error: string }> {
    return apiFetch<FormSnapshot>(`/api/forms/${slug}/bootstrap`);
  },

  // Submit gift selection
  async submitGiftSelection(
    slug: string,
    data: { nickname: string; giftId: string }
  ): Promise<{ success: true; data: { success: boolean; submission: Submission } } | { success: false; error: string }> {
    return apiFetch<{ success: boolean; submission: Submission }>(`/api/forms/${slug}/submissions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Admin API (requires auth)
export const adminApi = {
  // Authentication
  async login(password: string): Promise<{ success: true; data: { token: string } } | { success: false; error: string }> {
    return apiFetch<{ success: true; token: string }>(`/api/admin/auth`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  // Gifts
  async getGifts(formId: string, token: string): Promise<{ success: true; data: { gifts: ApiGift[] } } | { success: false; error: string }> {
    return apiFetch<{ success: true; gifts: ApiGift[] }>(`/api/admin/forms/${formId}/gifts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async createGift(
    formId: string,
    data: { name: string; code: string; description?: string; imageKey?: string; status?: GiftStatus; sortOrder?: number },
    token: string
  ): Promise<{ success: true; data: { gift: ApiGift } } | { success: false; error: string }> {
    return apiFetch<{ success: true; gift: ApiGift }>(`/api/admin/forms/${formId}/gifts`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async updateGift(
    formId: string,
    giftId: string,
    data: Partial<{ name: string; code: string; description: string; imageKey: string | null; status: GiftStatus; sortOrder: number }>,
    token: string
  ): Promise<{ success: true; data: { gift: ApiGift } } | { success: false; error: string }> {
    return apiFetch<{ success: true; gift: ApiGift }>(`/api/admin/forms/${formId}/gifts/${giftId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async deleteGift(
    formId: string,
    giftId: string,
    token: string
  ): Promise<{ success: true; data: { success: boolean } } | { success: false; error: string }> {
    return apiFetch<{ success: true }>(`/api/admin/forms/${formId}/gifts/${giftId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Submissions
  async getSubmissions(
    formId: string,
    token: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ success: true; data: PaginatedSubmissions } | { success: false; error: string }> {
    return apiFetch<PaginatedSubmissions>(`/api/admin/forms/${formId}/submissions?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async exportSubmissions(formId: string, token: string): Promise<Blob | null> {
    try {
      const response = await fetch(`/api/admin/forms/${formId}/submissions/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return null;
      return response.blob();
    } catch {
      return null;
    }
  },

  // Image upload
  async uploadImage(file: File, token: string): Promise<{ success: true; data: { imageKey: string } } | { success: false; error: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/images/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Upload failed' };
      }

      return { success: true, data: { imageKey: data.imageKey } };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Upload failed' 
      };
    }
  },
};
