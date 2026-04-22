import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import UserForm from './components/UserForm';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

// Default form ID - in a real app this would come from config or URL
const DEFAULT_FORM_ID = 'form-001';

function App() {
  const [adminToken, setAdminToken] = useState<string | null>(null);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<UserForm slug="gift-selection" />} />
        <Route
          path="/admin"
          element={
            adminToken ? (
              <AdminPanel
                token={adminToken}
                formId={DEFAULT_FORM_ID}
                onLogout={() => setAdminToken(null)}
              />
            ) : (
              <AdminLogin
                onLogin={(token) => {
                  setAdminToken(token);
                }}
              />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
