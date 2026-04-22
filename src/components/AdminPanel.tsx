import { LogOut } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Panel</h1>
        <p className="text-gray-600 mb-6">
          The admin panel will be implemented in Phase 4 with the following features:
        </p>
        <ul className="text-left text-gray-600 mb-6 space-y-2">
          <li>• Gift CRUD operations</li>
          <li>• Image upload to R2</li>
          <li>• Submissions management</li>
          <li>• CSV export</li>
          <li>• Form open/close control</li>
        </ul>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
