import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User, LogIn } from 'lucide-react';
import logo from '../assets/logo.png';

const MANAGER_URL = import.meta.env.VITE_MANAGER_URL || 'https://xflow-api.gsduran.es';

export default function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${MANAGER_URL}/auth/login`, {
                username,
                password
            });
            onLoginSuccess(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error connecting to auth service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-overlay">
            <div className="login-card glass-panel">
                <div className="login-header">
                    <img src={logo} alt="XFlow Logo" className="login-logo-img" />
                    <p>Enter your credentials to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="username">
                            <User size={18} />
                            <span>Username</span>
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Your username"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">
                            <Lock size={18} />
                            <span>Password</span>
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="brand-button" disabled={loading}>
                        {loading ? 'Authenticating...' : (
                            <>
                                <LogIn size={18} />
                                <span>Login</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
