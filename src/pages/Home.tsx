import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin, Star, Users, Home as HomeIcon } from 'lucide-react';
import api from '../services/api';
import FloatingContactButtons from '../components/FloatingContactButtons';
import styles from './Home.module.css';

interface Listing {
    _id: string;
    title: string;
    description: string;
    images: { url: string; isPrimary: boolean }[];
    address: {
        city: string;
        country: string;
    };
    capacity: {
        guests: number;
        bedrooms: number;
        beds: number;
        bathrooms: number;
    };
    pricing: {
        basePrice: number;
        currency: string;
    };
    propertyType: string;
    roomType: string;
    ratings: {
        average: number;
        count: number;
    };
    host: {
        firstName: string;
        lastName: string;
        avatar?: string;
    };
}

const Home: React.FC = () => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const response = await api.get('/admin/public/listings');
                setListings(response.data.data.listings);
            } catch (error) {
                console.error('Erreur lors du chargement des annonces:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    // Auto-scroll hero images
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3); // 3 images statiques
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    // Fonction pour obtenir les images statiques
    const getAllHeroImages = () => {
        return [
            '/1768945039221.jpg',
            '/1768945039338.jpg',
            '/1768945039417.jpg'
        ];
    };

    const scrollToListings = () => {
        document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #FF385C 0%, #E61E4D 100%)',
                color: 'white',
                fontSize: '20px'
            }}>
                <p>Chargement...</p>
            </div>
        );
    }

    // Utiliser les images statiques
    const heroImages = getAllHeroImages();

    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>
            <FloatingContactButtons />
            
            {/* Header transparent */}
            <header style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '20px 48px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 200,
                background: 'transparent'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <img src="/splash.png" alt="Eliotel" style={{ height: '36px' }} />
                    <span style={{ fontSize: '22px', fontWeight: '700', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>Eliotel</span>
                </div>
                
                <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <span
                        onClick={scrollToListings}
                        style={{
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.textShadow = '0 4px 8px rgba(0,0,0,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
                        }}
                    >
                        Logements
                    </span>
                    <span
                        onClick={() => navigate('/about')}
                        style={{
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.textShadow = '0 4px 8px rgba(0,0,0,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
                        }}
                    >
                        À propos
                    </span>
                    <span
                        onClick={() => navigate('/terms')}
                        style={{
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.textShadow = '0 4px 8px rgba(0,0,0,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
                        }}
                    >
                        Conditions générales
                    </span>
                    <span
                        onClick={() => navigate('/privacy')}
                        style={{
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.textShadow = '0 4px 8px rgba(0,0,0,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
                        }}
                    >
                        Politique de confidentialité
                    </span>
                    <span
                        onClick={() => navigate('/delete-account')}
                        style={{
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s',
                            background: 'rgba(220,38,38,0.75)',
                            padding: '6px 14px',
                            borderRadius: '20px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.background = 'rgba(220,38,38,1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.background = 'rgba(220,38,38,0.75)';
                        }}
                    >
                        Supprimer mon compte
                    </span>
                </nav>
            </header>

            {/* Hero Section */}
            <section className={styles.heroSection}>
                <div className={styles.heroBackground}>
                    <div className={styles.heroSlider}>
                        {heroImages.map((image, index) => (
                            <div
                                key={index}
                                className={`${styles.heroSlide} ${index === currentSlide ? styles.active : ''}`}
                                style={{ backgroundImage: `url(${image})` }}
                            />
                        ))}
                    </div>
                    <div className={styles.heroOverlay} />
                </div>

                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>
                        Découvrez votre prochain séjour
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Des logements uniques pour des vacances inoubliables en Tunisie. 
                        Trouvez le lieu parfait pour vous détendre et créer des souvenirs.
                    </p>
                    <button className={styles.heroButton} onClick={scrollToListings}>
                        <span>Explorer les logements</span>
                        <ChevronDown size={20} />
                    </button>

                    {/* App Download Buttons */}
                    <div className={styles.appButtons}>
                        <a
                            href="https://play.google.com/store/apps/details?id=com.eliotel.app&hl=fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.appButton}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#32BBFF"/>
                                <path d="M14.5 12.707l3.842 3.842-10.55 6.035a1.002 1.002 0 01-.183-.07L14.5 12.707z" fill="#32BBFF"/>
                                <path d="M18.342 16.549l3.377-1.933a1 1 0 000-1.732l-3.377-1.933L14.5 14.793l3.842 1.756z" fill="#32BBFF"/>
                                <path d="M7.609 1.936L18.159 7.97l-3.842 3.842L3.609 1.814c.054-.036.113-.065.183-.07l3.817 2.192z" fill="#32BBFF"/>
                            </svg>
                            <div className={styles.appButtonText}>
                                <span className={styles.appButtonLabel}>Télécharger sur</span>
                                <span className={styles.appButtonStore}>Google Play</span>
                            </div>
                        </a>

                        <a
                            href="https://apps.apple.com/tn/app/eliotel/id6756429975"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.appButton}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                            </svg>
                            <div className={styles.appButtonText}>
                                <span className={styles.appButtonLabel}>Télécharger sur</span>
                                <span className={styles.appButtonStore}>App Store</span>
                            </div>
                        </a>
                    </div>
                </div>

                <div className={styles.scrollIndicator}>
                    <ChevronDown size={32} color="white" />
                </div>
            </section>

            {/* Listings Section */}
            <section id="listings" className={styles.listingsSection}>
                <h2 className={styles.sectionTitle}>Nos logements disponibles</h2>
                
                {listings.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: '#6b7280'
                    }}>
                        <p style={{ fontSize: '18px' }}>Aucune annonce disponible pour le moment</p>
                    </div>
                ) : (
                    <div className={styles.listingsGrid}>
                        {listings.map((listing) => {
                            const primaryImage = listing.images.find(img => img.isPrimary)?.url || listing.images[0]?.url;
                            
                            return (
                                <div
                                    key={listing._id}
                                    className={styles.listingCard}
                                    onClick={() => navigate(`/listing/${listing._id}`)}
                                >
                                    <div 
                                        className={styles.listingImage}
                                        style={{ backgroundImage: `url(${primaryImage})` }}
                                    >
                                        {listing.ratings.count > 0 && (
                                            <div className={styles.listingBadge}>
                                                <Star size={14} fill="#FFD700" color="#FFD700" />
                                                {listing.ratings.average.toFixed(1)}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.listingContent}>
                                        <div className={styles.listingLocation}>
                                            <MapPin size={14} />
                                            <span>{listing.address.city}, {listing.address.country}</span>
                                        </div>

                                        <h3 className={styles.listingTitle}>
                                            {listing.title}
                                        </h3>

                                        <div className={styles.listingDetails}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Users size={14} />
                                                {listing.capacity.guests}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <HomeIcon size={14} />
                                                {listing.capacity.bedrooms}
                                            </div>
                                        </div>

                                        <div className={styles.listingPrice}>
                                            <div>
                                                <span className={styles.priceAmount}>
                                                    {listing.pricing.basePrice} {listing.pricing.currency}
                                                </span>
                                                <span className={styles.priceLabel}> / nuit</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid #e5e7eb',
                background: '#f9fafb',
                padding: '48px 24px 24px'
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '32px',
                        marginBottom: '32px'
                    }}>
                        {/* À propos */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <img src="/splash.png" alt="Eliotel" style={{ height: '32px' }} />
                                <span style={{ fontSize: '20px', fontWeight: '700', color: '#FF385C' }}>Eliotel</span>
                            </div>
                            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                                Votre plateforme de réservation de logements de vacances en Tunisie. 
                                Découvrez des hébergements uniques pour vos séjours.
                            </p>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
                                Contactez-nous
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <a
                                    href="tel:+33763223350"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#6b7280',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#FF385C'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                    </svg>
                                    +33 7 63 22 33 50
                                </a>
                                <a
                                    href="https://wa.me/33763223350"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#6b7280',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#25D366'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                    WhatsApp
                                </a>
                            </div>
                        </div>

                        {/* Liens rapides */}
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
                                Liens rapides
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <span
                                    onClick={() => navigate('/about')}
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#FF385C'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                >
                                    À propos
                                </span>
                                <span
                                    onClick={() => navigate('/terms')}
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#FF385C'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                >
                                    Conditions générales
                                </span>
                                <span
                                    onClick={() => navigate('/privacy')}
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#FF385C'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                >
                                    Politique de confidentialité
                                </span>
                                <span
                                    onClick={() => navigate('/admin/login')}
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#FF385C'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                >
                                    Espace Admin
                                </span>
                                <span
                                    onClick={() => navigate('/delete-account')}
                                    style={{
                                        color: '#dc2626',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#b91c1c'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#dc2626'}
                                >
                                    Supprimer mon compte
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div style={{
                        borderTop: '1px solid #e5e7eb',
                        paddingTop: '24px',
                        textAlign: 'center'
                    }}>
                        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                            © 2026 Eliotel. Tous droits réservés.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
