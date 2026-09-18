import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkAdminExists, loginAdmin } from '../services/adminService';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/admin';

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const exists = await checkAdminExists();
                if (!exists) {
                    navigate('/admin/signup');
                }
            } catch (err) {
                console.error("Erreur check admin exists", err);
            }
        };
        checkStatus();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await loginAdmin({ email, password });
            const { admin, token } = response.data;
            login(admin, token);
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Identifiants invalides');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--surface)',
            padding: '20px'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ marginBottom: '32px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <img src="/splash.png" alt="Eliotel Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Connexion Admin</h1>
                    <p style={{ color: 'var(--light)', fontSize: '14px', marginTop: '8px' }}>
                        Accédez au backoffice sécurisé d'Eliotel
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#FDE7E9',
                        color: 'var(--error)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="admin@eliotel.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Mot de passe</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '8px' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
