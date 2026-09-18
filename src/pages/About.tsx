import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Phone } from 'lucide-react';
import FloatingContactButtons from '../components/FloatingContactButtons';

const About: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>
            <FloatingContactButtons />
            
            {/* Header */}
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

            {/* Content */}
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
                <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '24px', color: '#111827' }}>
                    À propos d'Eliotel
                </h1>

                <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#4b5563' }}>
                    <p style={{ marginBottom: '20px' }}>
                        Eliotel est votre plateforme de confiance pour la réservation de logements de vacances en Tunisie. 
                        Nous mettons en relation les voyageurs avec des propriétaires proposant des hébergements uniques et authentiques.
                    </p>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '40px', marginBottom: '16px', color: '#111827' }}>
                        Notre Mission
                    </h2>
                    <p style={{ marginBottom: '20px' }}>
                        Faciliter la découverte et la réservation de logements exceptionnels tout en offrant une expérience 
                        de voyage mémorable. Nous croyons que chaque séjour doit être une aventure unique.
                    </p>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '40px', marginBottom: '16px', color: '#111827' }}>
                        Pourquoi Choisir Eliotel ?
                    </h2>
                    <ul style={{ marginBottom: '20px', paddingLeft: '24px' }}>
                        <li style={{ marginBottom: '12px' }}>Sélection rigoureuse des logements</li>
                        <li style={{ marginBottom: '12px' }}>Paiement sécurisé avec Konnect</li>
                        <li style={{ marginBottom: '12px' }}>Service client réactif</li>
                        <li style={{ marginBottom: '12px' }}>Prix transparents sans frais cachés</li>
                    </ul>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '40px', marginBottom: '16px', color: '#111827' }}>
                        Contactez-nous
                    </h2>
                    <div style={{ background: '#f9fafb', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Phone size={20} color="#FF385C" />
                            <a href="tel:+33763223350" style={{ color: '#FF385C', textDecoration: 'none', fontWeight: '500' }}>
                                +33 7 63 22 33 50
                            </a>
                        </div>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                            Notre équipe est disponible pour répondre à toutes vos questions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
