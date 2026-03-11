import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Briefcase, ExternalLink, Code, FileCode, Search, Filter, FolderKanban } from 'lucide-react';

const MANAGER_URL = import.meta.env.VITE_MANAGER_URL || 'https://xflow-api.gsduran.es';

export default function JobsDashboard() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [projectFilter, setProjectFilter] = useState('');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${MANAGER_URL}/jobs`);
                setJobs(response.data.jobs);
                setError(null);
            } catch (err) {
                console.error("Error fetching jobs:", err);
                setError("Could not load jobs from GitHub repository.");
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    const uniqueProjects = [...new Set(jobs.map(j => j.project).filter(Boolean))];

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            job.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            job.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesProject = projectFilter === '' || job.project === projectFilter;
        
        return matchesSearch && matchesProject;
    });

    if (loading) {
        return (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>Loading jobs from GitHub...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>⚠️</div>
                <h2>Error</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="jobs-container">
            <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Briefcase className="text-accent" size={28} />
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Available Jobs</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Listing automated processes from XFlow-jobs repository
                </p>
            </div>

            <div className="filters-container glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search by name, code or ID..."
                        className="form-input"
                        style={{ paddingLeft: '2.5rem', width: '100%', marginBottom: 0 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={16} className="text-accent" />
                    <select 
                        className="form-input" 
                        style={{ marginBottom: 0, padding: '0.5rem 1rem' }}
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                    >
                        <option value="">All Projects</option>
                        {uniqueProjects.map(project => <option key={project} value={project}>{project}</option>)}
                    </select>
                </div>
            </div>

            {filteredJobs.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {jobs.length === 0 ? "No jobs found in the repository." : "No jobs match your search or filter."}
                    </p>
                </div>
            ) : (
                <div className="agents-grid">
                    {filteredJobs.map(job => (
                        <div key={job.id} className="agent-card glass-panel">
                            <div className="agent-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div className="logo-icon" style={{ width: '40px', height: '40px', margin: 0 }}>
                                        <Code size={20} />
                                    </div>
                                    <span className="agent-title">{job.name}</span>
                                </div>
                                <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="icon-button"
                                    title="View on GitHub"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    <FileCode size={14} />
                                    <span>Main: {job.main_file}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <div>Code: <span className="text-accent" style={{ fontWeight: '600' }}>{job.code}</span></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <FolderKanban size={14} className="text-accent" />
                                        <span>Project: <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{job.project}</span></span>
                                    </div>
                                </div>
                            </div>

                            <button className="brand-button">
                                Run Job
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
