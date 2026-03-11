import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Plus, Folder, Tag, AlertCircle, Settings2, Trash2, X, PlusCircle, Globe, Briefcase } from 'lucide-react';

const MANAGER_URL = import.meta.env.VITE_MANAGER_URL || 'https://xflow-api.gsduran.es';

export default function VariablesDashboard() {
    const [projects, setProjects] = useState([]);
    const [definitions, setDefinitions] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectVars, setProjectVars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Modals
    const [showGlobalModal, setShowGlobalModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showAddDefModal, setShowAddDefModal] = useState(false);
    
    // Forms
    const [newProject, setNewProject] = useState({ code: '', name: '', description: '' });
    const [newDef, setNewDef] = useState({ key: '', label: '', data_type: 'string', default_value: '', project_id: null });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [projRes, defRes] = await Promise.all([
                axios.get(`${MANAGER_URL}/projects/`),
                axios.get(`${MANAGER_URL}/variable-definitions/`)
            ]);
            setProjects(projRes.data);
            setDefinitions(defRes.data);
            if (projRes.data.length > 0 && !selectedProject) {
                handleSelectProject(projRes.data[0]);
            } else if (selectedProject) {
                const updatedSelected = projRes.data.find(p => p.id === selectedProject.id);
                if (updatedSelected) handleSelectProject(updatedSelected);
            }
        } catch (err) {
            console.error("Error fetching variables data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProject = async (project) => {
        setSelectedProject(project);
        try {
            const res = await axios.get(`${MANAGER_URL}/projects/${project.id}/variables`);
            setProjectVars(res.data);
        } catch (err) {
            console.error("Error fetching project variables", err);
        }
    };

    const handleCreateProject = async () => {
        if (!newProject.code || !newProject.name) return alert("Code and Name are required");
        try {
            await axios.post(`${MANAGER_URL}/projects/`, newProject);
            setNewProject({ code: '', name: '', description: '' });
            setShowProjectModal(false);
            fetchData();
        } catch (err) {
            alert("Error creating project");
        }
    };

    const handleCreateDefinition = async () => {
        if (!newDef.key || !newDef.label) return alert("Key and Label are required");
        try {
            await axios.post(`${MANAGER_URL}/variable-definitions/`, newDef);
            setNewDef({ key: '', label: '', data_type: 'string', default_value: '', project_id: null });
            setShowAddDefModal(false);
            if (selectedProject) handleSelectProject(selectedProject);
            fetchData();
        } catch (err) {
            alert("Error creating definition");
        }
    };

    const handleDeleteDefinition = async (id) => {
        if (!window.confirm("Are you sure you want to delete this definition?")) return;
        try {
            await axios.delete(`${MANAGER_URL}/variable-definitions/${id}`);
            fetchData();
            if (selectedProject) handleSelectProject(selectedProject);
        } catch (err) {
            alert("Error deleting definition");
        }
    };

    const handleVarChange = (defId, newValue) => {
        setProjectVars(prev => prev.map(pv => 
            pv.definition.id === defId ? { ...pv, value: newValue } : pv
        ));
    };

    const handleSaveVariable = async (defId, value) => {
        setSaving(true);
        try {
            await axios.post(`${MANAGER_URL}/projects/${selectedProject.id}/variables`, {
                variable_definition_id: defId,
                value: String(value)
            });
        } catch (err) {
            console.error("Error saving variable", err);
            alert("Error saving variable");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading">Loading Dashboards...</div>;

    return (
        <div className="variables-dashboard">
            <div className="dashboard-grid">
                {/* Sidebar: Projects */}
                <div className="glass-panel sidebar-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Folder size={20} />
                            <h3>Projects</h3>
                        </div>
                        <button className="icon-btn-highlight" onClick={() => setShowProjectModal(true)}>
                            <PlusCircle size={20} />
                        </button>
                    </div>
                    <div className="project-list">
                        {projects.map(proj => (
                            <button 
                                key={proj.id}
                                className={`project-item ${selectedProject?.id === proj.id ? 'active' : ''}`}
                                onClick={() => handleSelectProject(proj)}
                            >
                                <span className="project-code">{proj.code}</span>
                                <span className="project-name">{proj.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content: Variables */}
                <div className="glass-panel main-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Tag size={20} />
                            <h3>Variables: <span style={{ color: 'var(--brand-color)' }}>{selectedProject?.name}</span></h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="secondary-button" onClick={() => setShowGlobalModal(true)}>
                                <Globe size={18} />
                                <span>Global Config</span>
                            </button>
                            <button className="brand-button" onClick={() => {
                                setNewDef({ ...newDef, project_id: selectedProject.id });
                                setShowAddDefModal(true);
                            }}>
                                <Plus size={18} />
                                <span>Add Project Variable</span>
                            </button>
                        </div>
                    </div>

                    <div className="variables-container">
                        {projectVars.length === 0 && (
                            <div className="empty-state">
                                <AlertCircle size={48} />
                                <p>No variables defined for this project.</p>
                                <p className="hint">Use the buttons above to add project-specific or global variables.</p>
                            </div>
                        )}

                        {projectVars.map(pv => (
                            <div key={pv.definition.id} className="variable-card">
                                <div className="variable-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <label>{pv.definition.label}</label>
                                        {pv.definition.project_id ? (
                                            <span className="badge-project" title="Project Specific"><Briefcase size={12}/></span>
                                        ) : (
                                            <span className="badge-global" title="Global Variable"><Globe size={12}/></span>
                                        )}
                                    </div>
                                    <span className="variable-key">{pv.definition.key}</span>
                                </div>
                                <div className="variable-input-group">
                                    {pv.definition.data_type === 'boolean' ? (
                                        <select 
                                            value={pv.value} 
                                            onChange={(e) => handleVarChange(pv.definition.id, e.target.value)}
                                        >
                                            <option value="true">True</option>
                                            <option value="false">False</option>
                                        </select>
                                    ) : pv.definition.data_type === 'number' ? (
                                        <input 
                                            type="number" 
                                            value={pv.value}
                                            onChange={(e) => handleVarChange(pv.definition.id, e.target.value)}
                                        />
                                    ) : (
                                        <input 
                                            type="text" 
                                            value={pv.value}
                                            onChange={(e) => handleVarChange(pv.definition.id, e.target.value)}
                                        />
                                    )}
                                    <button 
                                        className="save-var-btn"
                                        onClick={() => handleSaveVariable(pv.definition.id, pv.value)}
                                        disabled={saving}
                                        title="Save Value"
                                    >
                                        <Save size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal: Global Definitions */}
            {showGlobalModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: '800px' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Globe size={20} />
                                <h2>Global Variable Definitions</h2>
                            </div>
                            <button className="icon-btn" onClick={() => setShowGlobalModal(false)}><X /></button>
                        </div>
                        <div className="def-manager-container">
                            <button className="add-def-btn" onClick={() => {
                                setNewDef({ ...newDef, project_id: null });
                                setShowAddDefModal(true);
                            }}>
                                <PlusCircle size={18} />
                                <span>Add New Global Definition</span>
                            </button>
                            <div className="def-list">
                                {definitions.map(def => (
                                    <div key={def.id} className="def-item">
                                        <div className="def-info">
                                            <strong>{def.label}</strong>
                                            <code>{def.key}</code>
                                            <span className="type-tag">{def.data_type}</span>
                                        </div>
                                        <button className="delete-btn" onClick={() => handleDeleteDefinition(def.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Create Project */}
            {showProjectModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <div className="modal-header">
                            <h2>Create New Project</h2>
                            <button className="icon-btn" onClick={() => setShowProjectModal(false)}><X /></button>
                        </div>
                        <div className="modal-form">
                            <div className="input-group-form">
                                <label>Project Code (e.g. GSD)</label>
                                <input value={newProject.code} onChange={e => setNewProject({...newProject, code: e.target.value})} maxLength={10} />
                            </div>
                            <div className="input-group-form">
                                <label>Project Name</label>
                                <input value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
                            </div>
                            <div className="input-group-form">
                                <label>Description</label>
                                <textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
                            </div>
                            <button className="brand-button w-full" onClick={handleCreateProject}>Create Project</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add Definition (Unified for Global/Project) */}
            {showAddDefModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <div className="modal-header">
                            <h2>Add {newDef.project_id ? 'Project' : 'Global'} Definition</h2>
                            <button className="icon-btn" onClick={() => setShowAddDefModal(false)}><X /></button>
                        </div>
                        <div className="modal-form">
                            <div className="input-group-form">
                                <label>Variable Key (e.g. DB_URL)</label>
                                <input value={newDef.key} onChange={e => setNewDef({...newDef, key: e.target.value.toUpperCase().replace(/\s/g, '_')})} />
                            </div>
                            <div className="input-group-form">
                                <label>Display Label</label>
                                <input value={newDef.label} onChange={e => setNewDef({...newDef, label: e.target.value})} />
                            </div>
                            <div className="grid-2">
                                <div className="input-group-form">
                                    <label>Data Type</label>
                                    <select value={newDef.data_type} onChange={e => setNewDef({...newDef, data_type: e.target.value})}>
                                        <option value="string">String</option>
                                        <option value="number">Number</option>
                                        <option value="boolean">Boolean</option>
                                    </select>
                                </div>
                                <div className="input-group-form">
                                    <label>Default Value</label>
                                    <input value={newDef.default_value} onChange={e => setNewDef({...newDef, default_value: e.target.value})} />
                                </div>
                            </div>
                            <button className="brand-button w-full" onClick={handleCreateDefinition}>Create Definition</button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .variables-dashboard { padding: 3rem; height: calc(100vh - 120px); }
                .dashboard-grid { display: grid; grid-template-columns: 320px 1fr; gap: 3rem; height: 100%; }
                
                .panel-header {
                    display: flex; align-items: center; justify-content: space-between;
                    margin-bottom: 2.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem;
                }
                .panel-header h3 { margin: 0; font-size: 1.4rem; font-weight: 600; }
                
                .sidebar-panel { padding: 2.5rem; }
                .project-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .project-item {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
                    padding: 1.25rem; border-radius: 12px; text-align: left; cursor: pointer;
                    transition: all 0.2s; display: flex; flex-direction: column; color: var(--text-primary);
                }
                .project-item:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.1); }
                .project-item.active { background: var(--brand-color); border-color: var(--brand-color); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
                .project-code { font-weight: bold; font-size: 0.85rem; opacity: 0.7; text-transform: uppercase; margin-bottom: 0.25rem; }
                .project-name { font-size: 1.1rem; }

                .main-panel { padding: 3rem; }
                .variables-container { display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto; max-height: calc(100vh - 350px); padding-right: 1.5rem; }
                .variable-card {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
                    padding: 2rem; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; gap: 3rem;
                    transition: all 0.2s;
                }
                .variable-card:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); }
                
                .variable-info { display: flex; flex-direction: column; gap: 0.5rem; }
                .variable-info label { font-weight: 600; font-size: 1.1rem; color: var(--text-primary); }
                .variable-key { font-family: monospace; font-size: 0.8rem; color: var(--text-secondary); background: rgba(0,0,0,0.3); padding: 3px 8px; border-radius: 6px; align-self: flex-start; }
                
                .variable-input-group { display: flex; gap: 1rem; align-items: center; }
                .variable-input-group input, .variable-input-group select {
                    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white;
                    padding: 0.75rem 1.25rem; border-radius: 10px; min-width: 250px; font-size: 1rem;
                }
                .save-var-btn {
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white;
                    width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s;
                }
                .save-var-btn:hover:not(:disabled) { background: var(--brand-color); border-color: var(--brand-color); box-shadow: 0 4px 15px rgba(0,0,0,0.2); }

                /* Badges */
                .badge-global { color: #60a5fa; opacity: 0.8; }
                .badge-project { color: #fbbf24; opacity: 0.8; }

                /* Modals */
                .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
                .modal-content { width: 100%; max-width: 550px; padding: 3rem; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
                .modal-header h2 { margin: 0; font-size: 1.6rem; }
                .modal-form { display: flex; flex-direction: column; gap: 1.5rem; }
                .input-group-form { display: flex; flex-direction: column; gap: 0.5rem; }
                .input-group-form label { font-size: 0.9rem; color: var(--text-secondary); font-weight: 500; }
                .input-group-form input, .input-group-form select, .input-group-form textarea {
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white;
                    padding: 0.85rem 1.25rem; border-radius: 10px; font-size: 1rem;
                }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .w-full { width: 100%; }

                /* Def Manager */
                .add-def-btn { display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2); color: var(--text-primary); padding: 1.25rem; border-radius: 12px; cursor: pointer; width: 100%; justify-content: center; margin-bottom: 2rem; transition: 0.2s; }
                .add-def-btn:hover { background: rgba(255,255,255,0.1); border-color: var(--brand-color); }
                .def-list { display: flex; flex-direction: column; gap: 1rem; max-height: 400px; overflow-y: auto; padding-right: 1rem; }
                .def-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
                .def-info { display: flex; flex-direction: column; gap: 0.25rem; }
                .def-info code { font-size: 0.8rem; color: var(--brand-color); }
                .type-tag { font-size: 0.7rem; text-transform: uppercase; opacity: 0.5; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; width: fit-content; }
                
                .delete-btn { color: #f87171; background: none; border: none; cursor: pointer; opacity: 0.6; transition: 0.2s; }
                .delete-btn:hover { opacity: 1; transform: scale(1.1); }
                .icon-btn-highlight { background: none; border: none; color: var(--brand-color); cursor: pointer; transition: 0.2s; }
                .icon-btn-highlight:hover { transform: scale(1.2); }
                
                .secondary-button { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.6rem 1.25rem; border-radius: 10px; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: 0.2s; }
                .secondary-button:hover { background: rgba(255,255,255,0.05); }
            `}} />
        </div>
    );
}
