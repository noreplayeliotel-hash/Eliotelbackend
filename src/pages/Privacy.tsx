import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import FloatingContactButtons from '../components/FloatingContactButtons';

const Privacy: React.FC = () => {
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
                    Politique de Confidentialité
                </h1>

                <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#4b5563' }}>
                    <p style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>
                        Dernière mise à jour : Mars 2026
                    </p>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '40px', marginBottom: '16px', color: '#111827' }}>
                        1. Collecte des Données
                    </h2>
                    <p style={{ marginBottom: '20px' }}>
                        Nous collectons les informations nécessaires pour traiter vos réservations : nom, email, 
                        téléphone et informations de paiement.
                    </p>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '40px', marginBottom: '16px', color: '#111827' }}>
                        2. Utilisation des Données
                    </h2>
                    <p style={{ marginBottom: '20px' }}>
                        Vos données sont utilisées uniquement pour gérer vos réservations et améliorer nos services. 
                        Nous ne vendons jamais vos informations personnelles.
                    </p>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '40px', marginBottom: '16px', color: '#111827' }}>
                        3. Sécurité
                    </h2>
                    <p style={{ marginBottom: '20px' }}>
                        Nous utilisons des protocoles de sécurité standards pour protéger vos données. 
                        Les paiements sont traités via Konnect avec chiffrement SSL.
                    </p>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '40px', marginBottom: '16px', color: '#111827' }}>
                        4. Vos Droits
                    </h2>
                    <p style={{ marginBottom: '20px' }}>
                        Vous avez le droit d'accéder, modifier ou supprimer vos données personnelles. 
                        Contactez-nous au +33 7 63 22 33 50 pour toute demande.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
