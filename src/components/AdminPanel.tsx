import { useState, useEffect, useCallback } from 'react';
import {
  LogOut,
  Gift,
  Users,
  Upload,
  Download,
  Trash2,
  Edit2,
  Plus,
  X,
  Check,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { adminApi, type Submission, type PaginatedSubmissions, type ApiGift, type GiftStatus } from '../lib/api-client';

/* ─── Constants ─── */
const JF_BLUE = '#2e69ff';
const JF_BLUE_HOVER = '#1a5fff';
const JF_TEXT = '#2c3345';
const JF_LABEL = '#57647e';
const JF_BORDER = '#c3cad8';
const JF_BG = '#f3f3fe';
const JF_RED = '#f23a3c';
const JF_GREEN = '#18b815';

interface AdminPanelProps {
  token: string;
  formId: string;
  onLogout: () => void;
}

type Tab = 'gifts' | 'submissions';

export default function AdminPanel({ token, formId, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('gifts');
  
  // Gifts state
  const [gifts, setGifts] = useState<ApiGift[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(true);
  const [giftsError, setGiftsError] = useState<string | null>(null);
  
  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  
  // Modal state
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [editingGift, setEditingGift] = useState<ApiGift | null>(null);
  const [giftForm, setGiftForm] = useState({
    name: '',
    code: '',
    description: '',
    imageKey: '',
    status: 'available' as GiftStatus,
    sortOrder: 0,
  });
  const [giftFormLoading, setGiftFormLoading] = useState(false);
  const [giftFormError, setGiftFormError] = useState<string | null>(null);
  
  // Upload state
  const [uploading, setUploading] = useState(false);

  // Fetch gifts
  const fetchGifts = useCallback(async () => {
    setGiftsLoading(true);
    setGiftsError(null);
    
    const result = await adminApi.getGifts(formId, token);
    
    if (result.success) {
      setGifts(result.data.gifts);
    } else {
      setGiftsError(result.error);
    }
    
    setGiftsLoading(false);
  }, [formId, token]);

  // Fetch submissions
  const fetchSubmissions = useCallback(async (page: number = 1) => {
    setSubmissionsLoading(true);
    setSubmissionsError(null);
    
    const result = await adminApi.getSubmissions(formId, token, page, pagination.limit);
    
    if (result.success) {
      setSubmissions(result.data.submissions);
      setPagination(result.data.pagination);
    } else {
      setSubmissionsError(result.error);
    }
    
    setSubmissionsLoading(false);
  }, [formId, token, pagination.limit]);

  // Initial fetch
  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchSubmissions(pagination.page);
    }
  }, [activeTab, fetchSubmissions, pagination.page]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setGiftFormError(null);
    
    const result = await adminApi.uploadImage(file, token);
    
    if (result.success) {
      setGiftForm(prev => ({ ...prev, imageKey: result.data.imageKey }));
    } else {
      setGiftFormError(result.error);
    }
    
    setUploading(false);
    // Reset input
    e.target.value = '';
  };

  // Open gift modal for create
  const openCreateGift = () => {
    setEditingGift(null);
    setGiftForm({
      name: '',
      code: '',
      description: '',
      imageKey: '',
      status: 'available',
      sortOrder: gifts.length,
    });
    setGiftFormError(null);
    setShowGiftModal(true);
  };

  // Open gift modal for edit
  const openEditGift = (gift: ApiGift) => {
    setEditingGift(gift);
    setGiftForm({
      name: gift.name,
      code: gift.code,
      description: gift.description || '',
      imageKey: gift.imageKey || '',
      status: gift.status,
      sortOrder: gift.sortOrder,
    });
    setGiftFormError(null);
    setShowGiftModal(true);
  };

  // Save gift (create or update)
  const saveGift = async () => {
    if (!giftForm.name.trim() || !giftForm.code.trim()) {
      setGiftFormError('Name and code are required');
      return;
    }
    
    setGiftFormLoading(true);
    setGiftFormError(null);
    
    let result;
    if (editingGift) {
      result = await adminApi.updateGift(formId, editingGift.id, {
        name: giftForm.name,
        code: giftForm.code,
        description: giftForm.description,
        imageKey: giftForm.imageKey || null,
        status: giftForm.status,
        sortOrder: giftForm.sortOrder,
      }, token);
    } else {
      result = await adminApi.createGift(formId, {
        name: giftForm.name,
        code: giftForm.code,
        description: giftForm.description,
        imageKey: giftForm.imageKey || undefined,
        status: giftForm.status,
        sortOrder: giftForm.sortOrder,
      }, token);
    }
    
    if (result.success) {
      setShowGiftModal(false);
      fetchGifts();
    } else {
      setGiftFormError(result.error);
    }
    
    setGiftFormLoading(false);
  };

  // Delete gift
  const deleteGift = async (giftId: string) => {
    if (!confirm('Are you sure you want to delete this gift?')) return;
    
    const result = await adminApi.deleteGift(formId, giftId, token);
    
    if (result.success) {
      fetchGifts();
    } else {
      alert(result.error);
    }
  };

  // Export submissions
  const exportSubmissions = async () => {
    const blob = await adminApi.exportSubmissions(formId, token);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions-${formId}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert('Failed to export submissions');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: JF_BG }}>
      {/* Header */}
      <header className="bg-white border-b" style={{ borderColor: JF_BORDER }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: JF_TEXT }}>
            Admin Panel
          </h1>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors"
            style={{ 
              backgroundColor: '#f3f4f6',
              color: JF_TEXT,
            }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex gap-1 p-1 rounded-lg bg-white" style={{ border: `1px solid ${JF_BORDER}` }}>
          <button
            onClick={() => setActiveTab('gifts')}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors"
            style={{
              backgroundColor: activeTab === 'gifts' ? JF_BLUE : 'transparent',
              color: activeTab === 'gifts' ? '#ffffff' : JF_LABEL,
            }}
          >
            <Gift className="w-4 h-4 inline mr-2" />
            Gifts
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors"
            style={{
              backgroundColor: activeTab === 'submissions' ? JF_BLUE : 'transparent',
              color: activeTab === 'submissions' ? '#ffffff' : JF_LABEL,
            }}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Submissions
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Gifts Tab */}
        {activeTab === 'gifts' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: JF_TEXT }}>
                Manage Gifts ({gifts.length})
              </h2>
              <button
                onClick={openCreateGift}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded transition-colors"
                style={{ backgroundColor: JF_BLUE }}
              >
                <Plus className="w-4 h-4" />
                Add Gift
              </button>
            </div>

            {giftsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: JF_BLUE }} />
              </div>
            ) : giftsError ? (
              <div className="bg-white rounded-lg p-6 text-center" style={{ border: `1px solid ${JF_BORDER}` }}>
                <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: JF_RED }} />
                <p style={{ color: JF_TEXT }}>{giftsError}</p>
                <button
                  onClick={fetchGifts}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white rounded"
                  style={{ backgroundColor: JF_BLUE }}
                >
                  Retry
                </button>
              </div>
            ) : gifts.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center" style={{ border: `1px solid ${JF_BORDER}` }}>
                <Gift className="w-12 h-12 mx-auto mb-3" style={{ color: JF_LABEL }} />
                <p style={{ color: JF_TEXT }}>No gifts yet</p>
                <p className="text-sm mt-1" style={{ color: JF_LABEL }}>Click "Add Gift" to create your first gift</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {gifts.map(gift => (
                  <div
                    key={gift.id}
                    className="bg-white rounded-lg overflow-hidden"
                    style={{ border: `1px solid ${JF_BORDER}` }}
                  >
                    <div className="aspect-video bg-gray-100 relative">
                      {gift.imageKey ? (
                        <img
                          src={`/images/${gift.imageKey}`}
                          alt={gift.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8" style={{ color: JF_LABEL }} />
                        </div>
                      )}
                      <span
                        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded"
                        style={{
                          backgroundColor: gift.status === 'available' ? JF_GREEN : gift.status === 'selected' ? JF_BLUE : '#9ca3af',
                          color: '#ffffff',
                        }}
                      >
                        {gift.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold" style={{ color: JF_TEXT }}>{gift.name}</h3>
                      <p className="text-sm" style={{ color: JF_LABEL }}>Code: {gift.code}</p>
                      {gift.description && (
                        <p className="text-sm mt-1" style={{ color: JF_LABEL }}>{gift.description}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openEditGift(gift)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                          style={{ backgroundColor: '#f3f4f6', color: JF_TEXT }}
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteGift(gift.id)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                          style={{ backgroundColor: '#fef2f2', color: JF_RED }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: JF_TEXT }}>
                Submissions ({pagination.total})
              </h2>
              <button
                onClick={exportSubmissions}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors"
                style={{ backgroundColor: '#f3f4f6', color: JF_TEXT }}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {submissionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: JF_BLUE }} />
              </div>
            ) : submissionsError ? (
              <div className="bg-white rounded-lg p-6 text-center" style={{ border: `1px solid ${JF_BORDER}` }}>
                <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: JF_RED }} />
                <p style={{ color: JF_TEXT }}>{submissionsError}</p>
                <button
                  onClick={() => fetchSubmissions(pagination.page)}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white rounded"
                  style={{ backgroundColor: JF_BLUE }}
                >
                  Retry
                </button>
              </div>
            ) : submissions.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center" style={{ border: `1px solid ${JF_BORDER}` }}>
                <Users className="w-12 h-12 mx-auto mb-3" style={{ color: JF_LABEL }} />
                <p style={{ color: JF_TEXT }}>No submissions yet</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${JF_BORDER}` }}>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: JF_LABEL }}>Nickname</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: JF_LABEL }}>Gift</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: JF_LABEL }}>Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: JF_LABEL }}>Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: JF_BORDER }}>
                      {submissions.map(sub => (
                        <tr key={sub.id}>
                          <td className="px-4 py-3 text-sm" style={{ color: JF_TEXT }}>{sub.nickname}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: JF_TEXT }}>{sub.giftNameSnapshot}</td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-1 text-xs font-medium rounded"
                              style={{
                                backgroundColor: sub.status === 'active' ? '#dcfce7' : '#fef2f2',
                                color: sub.status === 'active' ? JF_GREEN : JF_RED,
                              }}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: JF_LABEL }}>
                            {new Date(sub.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm" style={{ color: JF_LABEL }}>
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-colors disabled:opacity-50"
                        style={{ backgroundColor: '#f3f4f6', color: JF_TEXT }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <button
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-colors disabled:opacity-50"
                        style={{ backgroundColor: '#f3f4f6', color: JF_TEXT }}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="w-full max-w-md bg-white rounded-lg p-6"
            style={{ border: `1px solid ${JF_BORDER}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: JF_TEXT }}>
                {editingGift ? 'Edit Gift' : 'Add Gift'}
              </h3>
              <button
                onClick={() => setShowGiftModal(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" style={{ color: JF_LABEL }} />
              </button>
            </div>

            {giftFormError && (
              <div
                className="mb-4 p-3 rounded-md flex items-start gap-2"
                style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: JF_RED }} />
                <p className="text-sm" style={{ color: JF_RED }}>{giftFormError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: JF_TEXT }}>
                  Name <span style={{ color: JF_RED }}>*</span>
                </label>
                <input
                  type="text"
                  value={giftForm.name}
                  onChange={e => setGiftForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{ borderColor: JF_BORDER }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: JF_TEXT }}>
                  Code <span style={{ color: JF_RED }}>*</span>
                </label>
                <input
                  type="text"
                  value={giftForm.code}
                  onChange={e => setGiftForm(p => ({ ...p, code: e.target.value }))}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{ borderColor: JF_BORDER }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: JF_TEXT }}>
                  Description
                </label>
                <textarea
                  value={giftForm.description}
                  onChange={e => setGiftForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{ borderColor: JF_BORDER }}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: JF_TEXT }}>
                  Image
                </label>
                <div className="flex items-center gap-3">
                  <label
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded cursor-pointer transition-colors"
                    style={{ backgroundColor: '#f3f4f6', color: JF_TEXT }}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {giftForm.imageKey && (
                    <span className="text-sm" style={{ color: JF_GREEN }}>
                      <Check className="w-4 h-4 inline mr-1" />
                      Image uploaded
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: JF_TEXT }}>
                  Status
                </label>
                <select
                  value={giftForm.status}
                  onChange={e => setGiftForm(p => ({ ...p, status: e.target.value as GiftStatus }))}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{ borderColor: JF_BORDER }}
                >
                  <option value="available">Available</option>
                  <option value="selected">Selected</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: JF_TEXT }}>
                  Sort Order
                </label>
                <input
                  type="number"
                  value={giftForm.sortOrder}
                  onChange={e => setGiftForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{ borderColor: JF_BORDER }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowGiftModal(false)}
                className="px-4 py-2 text-sm font-medium rounded transition-colors"
                style={{ backgroundColor: '#f3f4f6', color: JF_TEXT }}
              >
                Cancel
              </button>
              <button
                onClick={saveGift}
                disabled={giftFormLoading}
                className="px-4 py-2 text-sm font-medium text-white rounded transition-colors disabled:opacity-50"
                style={{ backgroundColor: JF_BLUE }}
              >
                {giftFormLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  editingGift ? 'Update' : 'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
