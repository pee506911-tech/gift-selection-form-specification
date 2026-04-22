import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import UserForm from './components/UserForm';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

function App() {
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<UserForm slug="gift-selection" />} />
        <Route
          path="/admin"
          element={
            adminLoggedIn ? (
              <AdminPanel onLogout={() => setAdminLoggedIn(false)} />
            ) : (
              <AdminLogin
                onLogin={() => {
                  setAdminLoggedIn(true);
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
