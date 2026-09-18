import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerAdmin } from '../services/adminService';
import { ShieldAlert } from 'lucide-react';

const AdminSignup: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await registerAdmin({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password
            });
            const { admin, token } = response.data;
            login(admin, token);
            navigate('/admin', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || "Erreur lors de la création du compte");
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
            <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: 'var(--primary)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <ShieldAlert size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Configurer l'Admin</h1>
                    <p style={{ color: 'var(--light)', fontSize: '14px', marginTop: '8px' }}>
                        Aucun compte administrateur trouvé. Créez le premier compte pour commencer.
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

                <form onSubmit={handleSubmit}>
                    <div className="signup-names-grid">
                        <div className="input-group">
                            <label className="input-label">Prénom</label>
                            <input
                                type="text"
                                name="firstName"
                                className="input-field"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Nom</label>
                            <input
                                type="text"
                                name="lastName"
                                className="input-field"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Email Professionnel</label>
                        <input
                            type="email"
                            name="email"
                            className="input-field"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Mot de passe</label>
                        <input
                            type="password"
                            name="password"
                            className="input-field"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Confirmer le mot de passe</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="input-field"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '8px' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Création...' : 'Créer mon compte Admin'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminSignup;
