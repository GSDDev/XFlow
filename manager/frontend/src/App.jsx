import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { LayoutDashboard, Briefcase, Settings, Key } from 'lucide-react';
import Dashboard from './components/Dashboard';
import JobsDashboard from './components/JobsDashboard';
import VariablesDashboard from './components/VariablesDashboard';
import CredentialsDashboard from './components/CredentialsDashboard';
import Login from './components/Login';
import logo from './assets/logo.png';

// Use environment variable if available, otherwise fallback to the production API URL
const MANAGER_URL = import.meta.env.VITE_MANAGER_URL || 'https://xflow-api.gsduran.es';

function App() {
  const [socket, setSocket] = useState(null);
  const [agents, setAgents] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('xflow_user'));
  const [currentTab, setCurrentTab] = useState('vdis'); // 'vdis', 'jobs', 'variables'

  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Fetch initial agents HTTP state
    axios.get(`${MANAGER_URL}/agents`)
      .then(res => setAgents(res.data.agents))
      .catch(err => console.error("Could not fetch agents", err));

    // 2. Setup Socket.IO for real-time updates
    const newSocket = io(MANAGER_URL);

    newSocket.on('connect', () => {
      console.log("Socket connected to Manager:", MANAGER_URL, "ID:", newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error("Socket connection error:", err);
    });

    setSocket(newSocket);

    const interval = setInterval(() => {
      axios.get(`${MANAGER_URL}/agents`)
        .then(res => setAgents(res.data.agents))
        .catch(err => console.error("Error polling agents", err));
    }, 2000);

    return () => {
      newSocket.disconnect();
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('xflow_user', JSON.stringify(userData));
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('xflow_user');
    setIsAuthenticated(false);
    if (socket) socket.disconnect();
  };

  return (
    <div className="app-container">
      {!isAuthenticated ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <header className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <img src={logo} alt="XFlow" className="header-logo" />
              <nav className="header-nav" style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className={`icon-button ${currentTab === 'vdis' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('vdis')}
                  title="VDI Dashboard"
                >
                  <LayoutDashboard size={20} />
                </button>
                <button
                  className={`icon-button ${currentTab === 'jobs' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('jobs')}
                  title="Jobs Dashboard"
                >
                  <Briefcase size={20} />
                </button>
                <button
                  className={`icon-button ${currentTab === 'variables' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('variables')}
                  title="Variables Dashboard"
                >
                  <Settings size={20} />
                </button>
                <button
                  className={`icon-button ${currentTab === 'credentials' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('credentials')}
                  title="Credentials Vault"
                >
                  <Key size={20} />
                </button>
              </nav>
            </div>
            <button className="icon-button logout-btn" onClick={handleLogout} title="Logout">
              <img src="/icon.png" alt="Logout" className="header-icon" />
            </button>
          </header>
          <main>
            {currentTab === 'vdis' && <Dashboard agents={agents} socket={socket} />}
            {currentTab === 'jobs' && <JobsDashboard />}
            {currentTab === 'variables' && <VariablesDashboard />}
            {currentTab === 'credentials' && <CredentialsDashboard />}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
