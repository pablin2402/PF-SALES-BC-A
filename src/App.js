import './App.css';
import Sidebars from './Sidebars';
import AppRoutes from './Routes';
import Login from './view/LoginView';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function AppWrapper() {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthenticated(true);
    }
    setCheckingAuth(false); 
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem("token", token); 
    setAuthenticated(true);
  };

  if (checkingAuth) return null;

  if (!authenticated && location.pathname !== '/login') {
    return <Navigate to="/login" />;
  }

  return (
    <>
      {location.pathname !== "/login" && <Sidebars />}
      <div className={location.pathname !== "/login" ? "ml-16 md:ml-60" : ""}>
      <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
