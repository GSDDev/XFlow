import React, { useState } from 'react';
import { Monitor, Cpu, MemoryStick, Activity, Search, Filter, User } from 'lucide-react';
import ScreenViewer from './ScreenViewer';

export default function Dashboard({ agents, socket }) {
    const [viewingAgent, setViewingAgent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [osFilter, setOsFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');

    const allAgents = Object.values(agents);

    // Get unique OS and Users for filters
    const uniqueOS = [...new Set(allAgents.map(a => a.os).filter(Boolean))];
    const uniqueUsers = [...new Set(allAgents.map(a => a.logged_user).filter(Boolean))];

    const filteredAgents = allAgents.filter(agent => {
        const matchesSearch = agent.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            agent.ip.includes(searchTerm) ||
                            (agent.os_version && agent.os_version.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesOS = osFilter === '' || agent.os === osFilter;
        const matchesUser = userFilter === '' || agent.logged_user === userFilter;
        
        return matchesSearch && matchesOS && matchesUser;
    });

    return (
        <>
            <div className="filters-container glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search by ID, IP or OS version..."
                        className="form-input"
                        style={{ paddingLeft: '2.5rem', width: '100%', marginBottom: 0 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={16} className="text-accent" />
                        <select 
                            className="form-input" 
                            style={{ marginBottom: 0, padding: '0.5rem 1rem' }}
                            value={osFilter}
                            onChange={(e) => setOsFilter(e.target.value)}
                        >
                            <option value="">All OS</option>
                            {uniqueOS.map(os => <option key={os} value={os}>{os}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} className="text-accent" />
                        <select 
                            className="form-input" 
                            style={{ marginBottom: 0, padding: '0.5rem 1rem' }}
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                        >
                            <option value="">All Users</option>
                            {uniqueUsers.map(user => <option key={user} value={user}>{user}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {filteredAgents.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Activity size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                    <h2>No VDIs Found</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {allAgents.length === 0 ? "Waiting for agents to connect..." : "Try adjusting your search or filters."}
                    </p>
                </div>
            ) : (
                <div className="agents-grid">
                    {filteredAgents.map(agent => (
                        <div key={agent.agent_id} className="agent-card glass-panel">
                            <div className="agent-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Monitor className="text-accent" />
                                    <span className="agent-title">{agent.agent_id}</span>
                                </div>
                                <div className="status-indicator">
                                    <span className="status-dot"></span> Online
                                </div>
                            </div>

                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                <div style={{ marginBottom: '0.25rem' }}>IP: {agent.ip}</div>
                                <div style={{ marginBottom: '0.25rem' }} title={agent.os_version}>OS: {agent.os_version || agent.os}</div>
                                <div>User: <span className="text-accent" style={{ fontWeight: '600' }}>{agent.logged_user || 'Unknown'}</span></div>
                            </div>

                            <div className="stats-grid">
                                <div className="stat-box">
                                    <div className="stat-label"><Cpu size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> CPU</div>
                                    <div className="stat-value">{agent.cpu_percent.toFixed(1)}%</div>
                                    <div className="stat-bar-bg">
                                        <div className="stat-bar-fill" style={{ width: `${agent.cpu_percent}%` }}></div>
                                    </div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-label"><MemoryStick size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> RAM</div>
                                    <div className="stat-value">{agent.ram_percent.toFixed(1)}%</div>
                                    <div className="stat-bar-bg">
                                        <div className="stat-bar-fill" style={{ width: `${agent.ram_percent}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="brand-button"
                                onClick={() => setViewingAgent(agent.agent_id)}
                            >
                                View Screen
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {viewingAgent && socket && (
                <ScreenViewer
                    agentId={viewingAgent}
                    socket={socket}
                    onClose={() => setViewingAgent(null)}
                />
            )}
        </>
    );
}
