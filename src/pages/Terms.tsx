import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import FloatingContactButtons from '../components/FloatingContactButtons';

const Terms: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>
            <FloatingContactButtons />
            
            <header style={{
                borderBottom: '1px solid #e5e7eb',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <img src="/splash.png" alt="Eliotel" style={{ height: '32px' }} />
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#FF385C' }}>Eliotel</span>
                </div>
                <button onClick={() => navigate('/')} style={{
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <Home size={16} />
                    Accueil
                </button>
            </header>

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
                <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '24px', color: '#111827' }}>
                    Conditions Générales d'Utilisation
                </h1>

                <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#4b5563' }}>
                    <p style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>
                        Dernière mise à jour : Mars 2026
                    </p>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '40px', marginBottom: '16px', color: '#111827' }}>
                        1. Acceptation des Conditions
                    </h2>
                    <p style={{ marginBottom: '20px' }}>
                        En utilisant Eliotel, vous acceptez les présentes conditions générales d'utilisation. 
                        Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
                    </p>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '40px', marginBottom: '16px', color: '#111827' }}>
                        2. Réservations
                    </h2>
                    <p style={{ marginBottom: '20px' }}>
                        Les réservations sont confirmées après paiement complet. Les annulations sont soumises 
                        aux politiques d'annulation spécifiques à chaque propriété.
                    </p>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '40px', marginBottom: '16px', color: '#111827' }}>
                        3. Paiements
                    </h2>
                    <p style={{ marginBottom: '20px' }}>
                        Les paiements sont traités de manière sécurisée via Konnect. Nous acceptons les cartes bancaires, 
                        e-Dinar et les paiements par wallet.
                    </p>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '40px', marginBottom: '16px', color: '#111827' }}>
                        4. Responsabilités
                    </h2>
                    <p style={{ marginBottom: '20px' }}>
                        Eliotel agit en tant qu'intermédiaire entre les voyageurs et les propriétaires. 
                        Nous ne sommes pas responsables des litiges entre les parties.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Terms;
