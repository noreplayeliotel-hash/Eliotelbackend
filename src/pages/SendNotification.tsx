import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendBroadcastNotification } from '../services/adminService';
import { Send, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';

const SendNotificationPage: React.FC = () => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: (data: { title: string, body: string }) =>
            sendBroadcastNotification(data.title, data.body),
        onSuccess: (response: any) => {
            setSuccess(`Notification envoyée avec succès à ${response.data.successCount} utilisateurs.`);
            setError(null);
            setTitle('');
            setBody('');
            // Reset success message after 5 seconds
            setTimeout(() => setSuccess(null), 5000);
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || err.message || "Une erreur est survenue lors de l'envoi.");
            setSuccess(null);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;

        if (window.confirm('Êtes-vous sûr de vouloir envoyer cette notification à TOUS les utilisateurs ?')) {
            mutation.mutate({ title, body });
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Envoi de Notification</h1>
                <p style={{ color: 'var(--light)', marginTop: '4px' }}>Envoyez une notification Push (FCM) à tous les utilisateurs enregistrés dans l'application.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label">Titre de la notification</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Ex: 🎉 Nouvelle mise à jour disponible !"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                disabled={mutation.isPending}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Message</label>
                            <textarea
                                className="input-field"
                                style={{ minHeight: '150px', resize: 'vertical' }}
                                placeholder="Contenu du message..."
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                required
                                disabled={mutation.isPending}
                            />
                        </div>

                        {error && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: '#FEF2F2',
                                border: '1px solid #F87171',
                                borderRadius: '8px',
                                color: '#991B1B',
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <AlertCircle size={20} />
                                <span style={{ fontSize: '14px' }}>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: '#F0FDF4',
                                border: '1px solid #4ADE80',
                                borderRadius: '8px',
                                color: '#166534',
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <CheckCircle2 size={20} />
                                <span style={{ fontSize: '14px' }}>{success}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', height: '48px' }}
                            disabled={mutation.isPending || !title.trim() || !body.trim()}
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Envoyer maintenant
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card" style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0369A1', marginBottom: '12px' }}>
                            <Info size={20} />
                            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Guide</h3>
                        </div>
                        <ul style={{ padding: 0, margin: 0, fontSize: '14px', color: '#0C4A6E', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <li style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ minWidth: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0369A1', marginTop: '6px' }}></div>
                                La notification sera envoyée à tous les utilisateurs (Hôtes et Voyageurs).
                            </li>
                            <li style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ minWidth: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0369A1', marginTop: '6px' }}></div>
                                Les utilisateurs recevront la notification instantanément sur leur mobile.
                            </li>
                            <li style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ minWidth: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0369A1', marginTop: '6px' }}></div>
                                Utilisez des emojis pour augmenter le taux d'ouverture.
                            </li>
                        </ul>
                    </div>

                    <div className="card" style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Aperçu Rapide</h3>
                        <div style={{
                            backgroundColor: '#F3F4F6',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid #E5E7EB'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: 'var(--primary)' }}></div>
                                <span style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Eliotel • À l'instant</span>
                            </div>
                            <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>
                                {title || 'Titre de la notification'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.4' }}>
                                {body || 'Contenu du message qui apparaîtra sur le smartphone de l\'utilisateur...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SendNotificationPage;
