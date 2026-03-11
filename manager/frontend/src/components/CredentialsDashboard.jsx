import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Key, Plus, Trash2, Edit2, Check, X, ShieldAlert, PlusCircle, LayoutGrid, Lock, Eye, EyeOff } from 'lucide-react';

const MANAGER_URL = import.meta.env.VITE_MANAGER_URL || 'https://xflow-api.gsduran.es';

export default function CredentialsDashboard() {
    const [applications, setApplications] = useState([]);
    const [credentials, setCredentials] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddingApp, setIsAddingApp] = useState(false);
    const [isAddingCred, setIsAddingCred] = useState(false);
    const [formError, setFormError] = useState('');
    const [visiblePasswords, setVisiblePasswords] = useState({}); // { credId: boolean }
    
    // New Cred Form
    const [newCred, setNewCred] = useState({
        application_id: '',
        project_id: '',
        alias: '',
        username: '',
        password_encrypted: ''
    });

    // New App Form
    const [newApp, setNewApp] = useState({ name: '', type: 'Web' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [appRes, credRes, projRes] = await Promise.all([
                axios.get(`${MANAGER_URL}/applications/`),
                axios.get(`${MANAGER_URL}/credentials/`),
                axios.get(`${MANAGER_URL}/projects/`)
            ]);
            setApplications(appRes.data);
            setCredentials(credRes.data);
            setProjects(projRes.data);
        } catch (err) {
            console.error("Error fetching credentials data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddApp = async () => {
        if (!newApp.name) return alert("App name is required");
        try {
            const res = await axios.post(`${MANAGER_URL}/applications/`, newApp);
            setApplications([...applications, res.data]);
            setIsAddingApp(false);
            setNewApp({ name: '', type: 'Web' });
        } catch (err) {
            alert("Error adding application");
        }
    };

    const handleAddCred = async () => {
        setFormError('');
        if (!newCred.application_id) return setFormError("Please select an application");
        if (!newCred.alias) return setFormError("Alias is required");

        const payload = {
            ...newCred,
            project_id: newCred.project_id || null
        };

        try {
            const res = await axios.post(`${MANAGER_URL}/credentials/`, payload);
            setCredentials([...credentials, res.data]);
            setIsAddingCred(false);
            setNewCred({ application_id: '', project_id: '', alias: '', username: '', password_encrypted: '' });
        } catch (err) {
            console.error(err);
            setFormError(err.response?.data?.detail?.[0]?.msg || "Error adding credential");
        }
    };

    const handleDeleteCred = async (id) => {
        if (!window.confirm("Are you sure you want to delete these credentials?")) return;
        try {
            await axios.delete(`${MANAGER_URL}/credentials/${id}`);
            setCredentials(credentials.filter(c => c.id !== id));
        } catch (err) {
            alert("Error deleting credential");
        }
    };

    const togglePasswordVisibility = (id) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (loading) return <div className="loading">Loading Credentials...</div>;

    return (
        <div className="credentials-dashboard">
            <div className="dashboard-grid">
                {/* Apps Section */}
                <div className="glass-panel sidebar-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <LayoutGrid size={22} className="icon-vibrant" />
                            <h3>Applications</h3>
                        </div>
                        <button className="icon-btn-highlight" onClick={() => setIsAddingApp(true)}>
                            <PlusCircle size={22} />
                        </button>
                    </div>

                    {isAddingApp && (
                        <div className="inline-form glass-panel">
                            <input 
                                placeholder="App Name (e.g. SAP)" 
                                value={newApp.name} 
                                onChange={e => setNewApp({...newApp, name: e.target.value})}
                            />
                            <select value={newApp.type} onChange={e => setNewApp({...newApp, type: e.target.value})}>
                                <option value="Web">Web</option>
                                <option value="ERP">ERP</option>
                                <option value="Desktop">Desktop</option>
                            </select>
                            <div className="form-actions">
                                <button className="confirm-btn" onClick={handleAddApp}><Check size={16}/></button>
                                <button className="cancel-btn" onClick={() => setIsAddingApp(false)}><X size={16}/></button>
                            </div>
                        </div>
                    )}

                    <div className="app-list">
                        {applications.map(app => (
                            <div key={app.id} className="app-pill">
                                <span className="app-name">{app.name}</span>
                                <span className="app-type">{app.type}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Credentials Section */}
                <div className="glass-panel main-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Lock size={22} className="icon-vibrant" />
                            <h3>Vault</h3>
                        </div>
                        <button className="brand-button" onClick={() => setIsAddingCred(true)} style={{ marginLeft: '2rem' }}>
                            <PlusCircle size={20} />
                            <span>Add New Credentials</span>
                        </button>
                    </div>

                    {isAddingCred && (
                        <div className="modal-overlay">
                            <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
                                <div className="modal-header">
                                    <h2>Store New Credential</h2>
                                    <button className="icon-btn" onClick={() => setIsAddingCred(false)}><X /></button>
                                </div>
                                <div className="modal-form-grid">
                                    <div className="input-group-full">
                                        <label>Alias / Name</label>
                                        <input value={newCred.alias} onChange={e => setNewCred({...newCred, alias: e.target.value})} placeholder="e.g. Admin SAP Production" />
                                    </div>
                                    <div className="input-group-form">
                                        <label>Application</label>
                                        <select value={newCred.application_id} onChange={e => setNewCred({...newCred, application_id: e.target.value})}>
                                            <option value="">Select Application...</option>
                                            {applications.map(app => <option key={app.id} value={app.id}>{app.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group-form">
                                        <label>Project Scope</label>
                                        <select value={newCred.project_id || ''} onChange={e => setNewCred({...newCred, project_id: e.target.value || null})}>
                                            <option value="">Global / No Project</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.code}: {p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group-form">
                                        <label>Username</label>
                                        <input value={newCred.username} onChange={e => setNewCred({...newCred, username: e.target.value})} placeholder="Username" />
                                    </div>
                                    <div className="input-group-form">
                                        <label>Password</label>
                                        <input type="password" value={newCred.password_encrypted} onChange={e => setNewCred({...newCred, password_encrypted: e.target.value})} placeholder="••••••••" />
                                    </div>
                                </div>
                                {formError && <div className="form-error-msg">{formError}</div>}
                                <div className="modal-footer">
                                    <button className="brand-button" onClick={handleAddCred}>Securely Save</button>
                                    <button className="cancel-text-btn" onClick={() => setIsAddingCred(false)}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="credentials-view">
                        {credentials.length === 0 && (
                            <div className="empty-state">
                                <ShieldAlert size={64} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
                                <p>Your vault is empty.</p>
                                <p className="hint">Categorize your tools and store credentials safely.</p>
                            </div>
                        )}
                        <div className="cred-card-grid">
                            {credentials.map(c => {
                                const app = applications.find(a => a.id === c.application_id);
                                const proj = projects.find(p => p.id === c.project_id);
                                const isVisible = visiblePasswords[c.id];

                                return (
                                    <div key={c.id} className="cred-card-refined">
                                        <div className="cred-card-body">
                                            <div className="cred-header-box">
                                                <span className="cred-title">{c.alias}</span>
                                                <div className="cred-tags">
                                                    <span className="tag-app">{app?.name}</span>
                                                    {proj && <span className="tag-project">{proj.code}</span>}
                                                </div>
                                            </div>
                                            <div className="cred-data-row">
                                                <div className="data-field">
                                                    <label>Username</label>
                                                    <span>{c.username}</span>
                                                </div>
                                                <div className="data-field">
                                                    <label>Password</label>
                                                    <div className="pwd-reveal-row">
                                                        <span className={isVisible ? "pwd-text" : "pwd-masked"}>
                                                            {isVisible ? c.password_encrypted : "••••••••"}
                                                        </span>
                                                        <button 
                                                            className="reveal-btn" 
                                                            onClick={() => togglePasswordVisibility(c.id)}
                                                            title={isVisible ? "Hide Password" : "Show Password"}
                                                        >
                                                            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="cred-card-actions">
                                            <button className="delete-action" onClick={() => handleDeleteCred(c.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .credentials-dashboard { padding: 3rem; height: calc(100vh - 120px); }
                .dashboard-grid { display: grid; grid-template-columns: 320px 1fr; gap: 3.5rem; height: 100%; }
                
                .panel-header {
                    display: flex; align-items: center; justify-content: space-between;
                    margin-bottom: 2.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem;
                }
                .panel-header h3 { margin: 0; font-size: 1.4rem; font-weight: 600; }
                .icon-vibrant { color: var(--brand-color); opacity: 0.9; }

                .sidebar-panel { padding: 2.5rem; }
                .app-list { display: flex; flex-direction: column; gap: 0.85rem; }
                .app-pill { 
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
                    padding: 1.25rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;
                }
                .app-pill:hover { background: rgba(255,255,255,0.06); }
                .app-name { font-weight: 500; font-size: 1rem; }
                .app-type { font-size: 0.65rem; opacity: 0.6; text-transform: uppercase; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 6px; letter-spacing: 0.5px; }
                
                .main-panel { padding: 3.5rem; }
                .credentials-view { overflow-y: auto; max-height: calc(100vh - 300px); padding-right: 1.5rem; }
                .cred-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); gap: 2.5rem; }
                
                .cred-card-refined { 
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 20px; padding: 2.5rem; display: flex; justify-content: space-between; align-items: center;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .cred-card-refined:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
                
                .cred-header-box { margin-bottom: 1.5rem; }
                .cred-title { display: block; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; letter-spacing: -0.5px; }
                .cred-tags { display: flex; gap: 0.5rem; }
                .tag-app { font-size: 0.75rem; background: rgba(96, 165, 250, 0.15); color: #93c5fd; padding: 4px 10px; border-radius: 8px; font-weight: 600; }
                .tag-project { font-size: 0.75rem; background: rgba(251, 191, 36, 0.15); color: #fbbf24; padding: 4px 10px; border-radius: 8px; font-weight: 600; }
                
                .cred-data-row { display: flex; gap: 3rem; }
                .data-field label { display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-weight: 600; }
                .data-field span { font-size: 1rem; color: var(--text-primary); }
                
                .pwd-reveal-row { display: flex; align-items: center; gap: 0.75rem; }
                .pwd-text { color: #4ade80; font-family: monospace; font-weight: 600; }
                .pwd-masked { opacity: 0.4; letter-spacing: 2px; }
                .reveal-btn { background: rgba(255,255,255,0.05); border: none; color: white; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
                .reveal-btn:hover { background: rgba(255,255,255,0.15); transform: scale(1.1); }

                .delete-action { background: none; border: none; color: #f87171; cursor: pointer; opacity: 0.4; transition: 0.2s; padding: 10px; }
                .delete-action:hover { opacity: 1; transform: scale(1.1); color: #ff6b6b; }

                /* Modal Styling */
                .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 1005; padding: 2rem; }
                .modal-content { width: 100%; border-radius: 24px; padding: 4rem; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
                .modal-header h2 { margin: 0; font-size: 1.8rem; font-weight: 700; letter-spacing: -0.5px; }
                
                .modal-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem; }
                .input-group-full { grid-column: span 2; display: flex; flex-direction: column; gap: 0.75rem; }
                .input-group-form { display: flex; flex-direction: column; gap: 0.75rem; }
                .input-group-form label, .input-group-full label { font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; }
                .input-group-form input, .input-group-form select, .input-group-full input {
                    background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); color: white;
                    padding: 1.1rem 1.4rem; border-radius: 14px; font-size: 1rem; transition: 0.2s;
                }
                .input-group-form input:focus, .input-group-form select:focus, .input-group-full input:focus { border-color: var(--brand-color); outline: none; background: rgba(0,0,0,0.4); }
                
                .form-error-msg { margin-bottom: 2rem; color: #f87171; font-size: 0.9rem; background: rgba(248, 113, 113, 0.1); padding: 1rem; border-radius: 12px; }
                .modal-footer { display: flex; align-items: center; gap: 2rem; }
                .cancel-text-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1rem; font-weight: 500; }
                .cancel-text-btn:hover { color: var(--text-primary); }

                .inline-form { padding: 1.5rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
                .form-actions { display: flex; gap: 0.75rem; }
                .confirm-btn { background: #4ade80; color: black; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; font-weight: bold; }
                .cancel-btn { background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
                
                .icon-btn-highlight { background: none; border: none; color: var(--brand-color); cursor: pointer; transition: 0.2s; display: flex; align-items: center; }
                .icon-btn-highlight:hover { transform: scale(1.15); filter: brightness(1.2); }
                
                .hint { font-size: 0.9rem; opacity: 0.5; margin-top: 0.5rem; }
            `}} />
        </div>
    );
}
