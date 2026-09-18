import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DeleteAccount: React.FC = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', reason: '', confirm: false });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{
                background: '#fff',
                borderBottom: '1px solid #e5e7eb',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <img src="/splash.png" alt="Eliotel" style={{ height: '32px', cursor: 'pointer' }} onClick={() => navigate('/')} />
                <span style={{ fontSize: '20px', fontWeight: '700', color: '#FF385C', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    Eliotel
                </span>
            </header>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    padding: '40px',
                    width: '100%',
                    maxWidth: '520px'
                }}>
                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: '#dcfce7', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', margin: '0 auto 20px'
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
                                Demande envoyée
                            </h2>
                            <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
                                Votre demande de suppression de compte a bien été reçue. Notre équipe la traitera dans un délai de 30 jours et vous contactera à l'adresse e-mail fournie.
                            </p>
                            <button
                                onClick={() => navigate('/')}
                                style={{
                                    padding: '12px 28px',
                                    background: '#FF385C',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Retour à l'accueil
                            </button>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '28px' }}>
                                <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                                    Supprimer mon compte
                                </h1>
                                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                                    Cette action est irréversible. Toutes vos données personnelles, réservations et historique seront définitivement supprimés conformément à notre politique de confidentialité.
                                </p>
                            </div>

                            {/* Warning box */}
                            <div style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                padding: '14px 16px',
                                marginBottom: '24px',
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'flex-start'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <p style={{ color: '#dc2626', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                                    La suppression de votre compte entraîne la perte définitive de toutes vos données. Cette opération ne peut pas être annulée.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                        Adresse e-mail du compte *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="votre@email.com"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '15px',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#FF385C'}
                                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                        Raison de la suppression
                                    </label>
                                    <select
                                        value={form.reason}
                                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '15px',
                                            outline: 'none',
                                            background: '#fff',
                                            boxSizing: 'border-box',
                                            color: form.reason ? '#111827' : '#9ca3af'
                                        }}
                                        onFocus={(e) => e.currentTarget.style.borderColor = '#FF385C'}
                                        onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                                    >
                                        <option value="" disabled>Sélectionnez une raison</option>
                                        <option value="no_longer_use">Je n'utilise plus l'application</option>
                                        <option value="privacy">Préoccupations liées à la confidentialité</option>
                                        <option value="bad_experience">Mauvaise expérience utilisateur</option>
                                        <option value="found_alternative">J'ai trouvé une alternative</option>
                                        <option value="other">Autre raison</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        id="confirm"
                                        required
                                        checked={form.confirm}
                                        onChange={(e) => setForm({ ...form, confirm: e.target.checked })}
                                        style={{ marginTop: '3px', accentColor: '#FF385C', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }}
                                    />
                                    <label htmlFor="confirm" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer', lineHeight: '1.5' }}>
                                        Je comprends que cette action est irréversible et que toutes mes données seront définitivement supprimées.
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    style={{
                                        padding: '13px',
                                        background: '#dc2626',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                                >
                                    Soumettre la demande de suppression
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    style={{
                                        padding: '13px',
                                        background: 'transparent',
                                        color: '#6b7280',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = '#374151'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
                                >
                                    Annuler
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                    © 2026 Eliotel. Tous droits réservés. —{' '}
                    <span style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => navigate('/privacy')}>Politique de confidentialité</span>
                </p>
            </footer>
        </div>
    );
};

export default DeleteAccount;
