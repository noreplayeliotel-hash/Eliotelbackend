import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Star, Wifi, Car, Tv, Wind, Coffee, Check, X, Users, Home as HomeIcon, Bed, Bath, Shield, Utensils, Waves, Dumbbell, Flame, Droplet, Shirt, Lock, Baby, Dog, Cigarette, Music, Laptop, Microwave, Refrigerator, WashingMachine, Phone, MessageCircle } from 'lucide-react';
import api from '../services/api';
import FloatingContactButtons from '../components/FloatingContactButtons';
import styles from './ListingDetail.module.css';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Listing {
    _id: string;
    title: string;
    description: string;
    images: { url: string; isPrimary: boolean }[];
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    location?: {
        type: string;
        coordinates: [number, number];
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
        cleaningFee?: number;
        serviceFee?: number;
        weeklyDiscount?: number;
        monthlyDiscount?: number;
    };
    propertyType: string;
    roomType: string;
    amenities: string[];
    houseRules: {
        checkIn: string;
        checkOut: string;
        smokingAllowed: boolean;
        petsAllowed: boolean;
        partiesAllowed: boolean;
        additionalRules?: string;
    };
    ratings: {
        average: number;
        count: number;
    };
    host: {
        _id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        email: string;
        createdAt?: string;
    };
    availability: {
        minNights: number;
        maxNights: number;
    };
    status: string;
    createdAt: string;
}

const ListingDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [listing, setListing] = useState<Listing | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const response = await api.get(`/admin/public/listings/${id}`);
                setListing(response.data.data);
            } catch (error) {
                console.error('Erreur lors du chargement du logement:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchReviews = async () => {
            try {
                const response = await api.get(`/admin/public/listings/${id}/reviews`);
                setReviews(response.data.data);
            } catch (error) {
                console.error('Erreur lors du chargement des avis:', error);
            }
        };

        if (id) {
            fetchListing();
            fetchReviews();
        }
    }, [id]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Chargement...</p>
            </div>
        );
    }

    if (!listing) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                <p>Logement non trouvé</p>
                <button onClick={() => navigate('/')} style={{ padding: '8px 16px', background: '#FF385C', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Retour à l'accueil
                </button>
            </div>
        );
    }

    // Mapping des équipements avec icônes et traductions
    const amenityMapping: Record<string, { icon: any; label: string }> = {
        // Internet & Divertissement
        'WiFi': { icon: Wifi, label: 'WiFi gratuit' },
        'wifi': { icon: Wifi, label: 'WiFi gratuit' },
        'TV': { icon: Tv, label: 'Télévision' },
        'tv': { icon: Tv, label: 'Télévision' },
        'Cable TV': { icon: Tv, label: 'Télévision par câble' },
        'cable_tv': { icon: Tv, label: 'Télévision par câble' },
        'Netflix': { icon: Tv, label: 'Netflix' },
        'netflix': { icon: Tv, label: 'Netflix' },
        'Sound system': { icon: Music, label: 'Système audio' },
        'sound_system': { icon: Music, label: 'Système audio' },
        'Workspace': { icon: Laptop, label: 'Espace de travail' },
        'workspace': { icon: Laptop, label: 'Espace de travail' },
        
        // Cuisine
        'Kitchen': { icon: Utensils, label: 'Cuisine équipée' },
        'kitchen': { icon: Utensils, label: 'Cuisine équipée' },
        'Cuisine': { icon: Utensils, label: 'Cuisine équipée' },
        'Coffee maker': { icon: Coffee, label: 'Machine à café' },
        'coffee_maker': { icon: Coffee, label: 'Machine à café' },
        'Microwave': { icon: Microwave, label: 'Micro-ondes' },
        'microwave': { icon: Microwave, label: 'Micro-ondes' },
        'Refrigerator': { icon: Refrigerator, label: 'Réfrigérateur' },
        'refrigerator': { icon: Refrigerator, label: 'Réfrigérateur' },
        'Dishwasher': { icon: Droplet, label: 'Lave-vaisselle' },
        'dishwasher': { icon: Droplet, label: 'Lave-vaisselle' },
        'Cooking basics': { icon: Utensils, label: 'Ustensiles de cuisine' },
        'cooking_basics': { icon: Utensils, label: 'Ustensiles de cuisine' },
        
        // Climatisation & Chauffage
        'Air conditioning': { icon: Wind, label: 'Climatisation' },
        'air_conditioning': { icon: Wind, label: 'Climatisation' },
        'Climatisation': { icon: Wind, label: 'Climatisation' },
        'AC': { icon: Wind, label: 'Climatisation' },
        'ac': { icon: Wind, label: 'Climatisation' },
        'Heating': { icon: Flame, label: 'Chauffage' },
        'heating': { icon: Flame, label: 'Chauffage' },
        'Chauffage': { icon: Flame, label: 'Chauffage' },
        
        // Extérieur & Parking
        'Parking': { icon: Car, label: 'Parking gratuit' },
        'parking': { icon: Car, label: 'Parking gratuit' },
        'Free parking': { icon: Car, label: 'Parking gratuit' },
        'free_parking': { icon: Car, label: 'Parking gratuit' },
        'Pool': { icon: Waves, label: 'Piscine' },
        'pool': { icon: Waves, label: 'Piscine' },
        'Piscine': { icon: Waves, label: 'Piscine' },
        'Hot tub': { icon: Waves, label: 'Jacuzzi' },
        'hot_tub': { icon: Waves, label: 'Jacuzzi' },
        'Jacuzzi': { icon: Waves, label: 'Jacuzzi' },
        'jacuzzi': { icon: Waves, label: 'Jacuzzi' },
        'Garden': { icon: HomeIcon, label: 'Jardin' },
        'garden': { icon: HomeIcon, label: 'Jardin' },
        'Balcony': { icon: HomeIcon, label: 'Balcon' },
        'balcony': { icon: HomeIcon, label: 'Balcon' },
        'Patio': { icon: HomeIcon, label: 'Terrasse' },
        'patio': { icon: HomeIcon, label: 'Terrasse' },
        'Terrace': { icon: HomeIcon, label: 'Terrasse' },
        'terrace': { icon: HomeIcon, label: 'Terrasse' },
        
        // Salle de bain & Linge
        'Washer': { icon: WashingMachine, label: 'Machine à laver' },
        'washer': { icon: WashingMachine, label: 'Machine à laver' },
        'Washing machine': { icon: WashingMachine, label: 'Machine à laver' },
        'washing_machine': { icon: WashingMachine, label: 'Machine à laver' },
        'Dryer': { icon: Shirt, label: 'Sèche-linge' },
        'dryer': { icon: Shirt, label: 'Sèche-linge' },
        'Hair dryer': { icon: Wind, label: 'Sèche-cheveux' },
        'hair_dryer': { icon: Wind, label: 'Sèche-cheveux' },
        'Shampoo': { icon: Droplet, label: 'Shampoing' },
        'shampoo': { icon: Droplet, label: 'Shampoing' },
        'Hot water': { icon: Droplet, label: 'Eau chaude' },
        'hot_water': { icon: Droplet, label: 'Eau chaude' },
        
        // Sécurité
        'Smoke alarm': { icon: Shield, label: 'Détecteur de fumée' },
        'smoke_alarm': { icon: Shield, label: 'Détecteur de fumée' },
        'Carbon monoxide alarm': { icon: Shield, label: 'Détecteur de CO' },
        'carbon_monoxide_alarm': { icon: Shield, label: 'Détecteur de CO' },
        'Fire extinguisher': { icon: Shield, label: 'Extincteur' },
        'fire_extinguisher': { icon: Shield, label: 'Extincteur' },
        'First aid kit': { icon: Shield, label: 'Trousse de premiers secours' },
        'first_aid_kit': { icon: Shield, label: 'Trousse de premiers secours' },
        'Lock': { icon: Lock, label: 'Serrure sécurisée' },
        'lock': { icon: Lock, label: 'Serrure sécurisée' },
        'Safe': { icon: Lock, label: 'Coffre-fort' },
        'safe': { icon: Lock, label: 'Coffre-fort' },
        
        // Famille
        'Crib': { icon: Baby, label: 'Lit bébé' },
        'crib': { icon: Baby, label: 'Lit bébé' },
        'High chair': { icon: Baby, label: 'Chaise haute' },
        'high_chair': { icon: Baby, label: 'Chaise haute' },
        'Baby bath': { icon: Baby, label: 'Baignoire bébé' },
        'baby_bath': { icon: Baby, label: 'Baignoire bébé' },
        'Children\'s books': { icon: Baby, label: 'Livres pour enfants' },
        'childrens_books': { icon: Baby, label: 'Livres pour enfants' },
        
        // Animaux & Fumeur
        'Pets allowed': { icon: Dog, label: 'Animaux acceptés' },
        'pets_allowed': { icon: Dog, label: 'Animaux acceptés' },
        'Smoking allowed': { icon: Cigarette, label: 'Fumeur autorisé' },
        'smoking_allowed': { icon: Cigarette, label: 'Fumeur autorisé' },
        
        // Sport & Fitness
        'Gym': { icon: Dumbbell, label: 'Salle de sport' },
        'gym': { icon: Dumbbell, label: 'Salle de sport' },
        'Exercise equipment': { icon: Dumbbell, label: 'Équipement fitness' },
        'exercise_equipment': { icon: Dumbbell, label: 'Équipement fitness' },
    };

    const getAmenityDisplay = (amenity: string) => {
        // Chercher une correspondance exacte
        if (amenityMapping[amenity]) {
            return amenityMapping[amenity];
        }
        
        // Convertir les underscores en espaces et chercher à nouveau
        const amenityWithSpaces = amenity.replace(/_/g, ' ');
        if (amenityMapping[amenityWithSpaces]) {
            return amenityMapping[amenityWithSpaces];
        }
        
        // Chercher en minuscules
        const lowerAmenity = amenity.toLowerCase();
        if (amenityMapping[lowerAmenity]) {
            return amenityMapping[lowerAmenity];
        }
        
        // Chercher avec underscores en minuscules
        const lowerWithSpaces = amenityWithSpaces.toLowerCase();
        if (amenityMapping[lowerWithSpaces]) {
            return amenityMapping[lowerWithSpaces];
        }
        
        // Chercher une correspondance partielle (insensible à la casse)
        for (const [key, value] of Object.entries(amenityMapping)) {
            if (key.toLowerCase().includes(lowerAmenity) || lowerAmenity.includes(key.toLowerCase())) {
                return value;
            }
        }
        
        // Par défaut, retourner l'équipement formaté avec l'icône Check
        // Convertir snake_case en Title Case
        const formattedLabel = amenityWithSpaces
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        return { icon: Check, label: formattedLabel };
    };

    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>
            <FloatingContactButtons />
            
            {/* Content */}
            <div className={styles.contentWrapper} style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
                {/* Title */}
                <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>
                    {listing.title}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {listing.ratings.count > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={16} fill="#FFD700" color="#FFD700" />
                            <span style={{ fontWeight: '600' }}>{listing.ratings.average.toFixed(1)}</span>
                            <span style={{ color: '#6b7280' }}>({listing.ratings.count} avis)</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280' }}>
                        <MapPin size={16} />
                        <span>{listing.address.city}, {listing.address.country}</span>
                    </div>
                </div>

                {/* Images Gallery */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{
                        height: '500px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginBottom: '16px',
                        background: `url(${listing.images[selectedImage]?.url}) center/cover`
                    }} />
                    <div className={styles.imageGallery}>
                        {listing.images.map((img, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedImage(idx)}
                                style={{
                                    minWidth: '120px',
                                    height: '80px',
                                    borderRadius: '8px',
                                    background: `url(${img.url}) center/cover`,
                                    cursor: 'pointer',
                                    border: selectedImage === idx ? '3px solid #FF385C' : '1px solid #e5e7eb'
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Coup de cœur Section */}
                {listing.ratings.average >= 4.5 && listing.ratings.count > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                        <div className={styles.featuredBadge}>
                            <Star size={24} fill="#fff" color="#fff" />
                            <div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>
                                    {listing.ratings.average.toFixed(1)} Coup de cœur voyageurs
                                </div>
                                <div style={{ fontSize: '14px', color: '#fff', opacity: 0.9 }}>
                                    Ce logement fait partie des {Math.round((listing.ratings.average / 5) * 100)}% de logements préférés sur Eliotel
                                </div>
                            </div>
                        </div>

                        <div className={styles.ratingsContainer}>
                            {/* Évaluation globale à gauche */}
                            <div className={styles.globalRating}>
                                <div className={styles.globalRatingTitle}>Évaluation globale</div>
                                <div className={styles.globalRatingBars}>
                                    {[5, 4, 3, 2, 1].map((num) => (
                                        <div key={num} className={styles.globalRatingBar}>
                                            <span>{num}</span>
                                            <div className={styles.globalRatingBarLine}>
                                                <div 
                                                    className={styles.globalRatingBarFill} 
                                                    style={{ width: num === 5 ? '100%' : '0%' }} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Grille des notes détaillées à droite */}
                            <div className={styles.ratingsGrid}>
                                <div className={styles.ratingItem}>
                                    <div className={styles.ratingIcon}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                            <polyline points="9 22 9 12 15 12 15 22"/>
                                        </svg>
                                    </div>
                                    <div className={styles.ratingLabel}>Propreté</div>
                                    <div className={styles.ratingValue}>{listing.ratings.average.toFixed(1)}</div>
                                    <div className={styles.ratingBar}>
                                        <div className={styles.ratingBarFill} style={{ width: `${(listing.ratings.average / 5) * 100}%` }} />
                                    </div>
                                </div>

                                <div className={styles.ratingItem}>
                                    <div className={styles.ratingIcon}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <polyline points="12 6 12 12 16 14"/>
                                        </svg>
                                    </div>
                                    <div className={styles.ratingLabel}>Précision</div>
                                    <div className={styles.ratingValue}>{listing.ratings.average.toFixed(1)}</div>
                                    <div className={styles.ratingBar}>
                                        <div className={styles.ratingBarFill} style={{ width: `${(listing.ratings.average / 5) * 100}%` }} />
                                    </div>
                                </div>

                                <div className={styles.ratingItem}>
                                    <div className={styles.ratingIcon}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                            <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                    </div>
                                    <div className={styles.ratingLabel}>Arrivée</div>
                                    <div className={styles.ratingValue}>{listing.ratings.average.toFixed(1)}</div>
                                    <div className={styles.ratingBar}>
                                        <div className={styles.ratingBarFill} style={{ width: `${(listing.ratings.average / 5) * 100}%` }} />
                                    </div>
                                </div>

                                <div className={styles.ratingItem}>
                                    <div className={styles.ratingIcon}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                        </svg>
                                    </div>
                                    <div className={styles.ratingLabel}>Communication</div>
                                    <div className={styles.ratingValue}>{listing.ratings.average.toFixed(1)}</div>
                                    <div className={styles.ratingBar}>
                                        <div className={styles.ratingBarFill} style={{ width: `${(listing.ratings.average / 5) * 100}%` }} />
                                    </div>
                                </div>

                                <div className={styles.ratingItem}>
                                    <div className={styles.ratingIcon}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                            <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                    </div>
                                    <div className={styles.ratingLabel}>Emplacement</div>
                                    <div className={styles.ratingValue}>{listing.ratings.average.toFixed(1)}</div>
                                    <div className={styles.ratingBar}>
                                        <div className={styles.ratingBarFill} style={{ width: `${(listing.ratings.average / 5) * 100}%` }} />
                                    </div>
                                </div>

                                <div className={styles.ratingItem}>
                                    <div className={styles.ratingIcon}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="1" x2="12" y2="23"/>
                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                        </svg>
                                    </div>
                                    <div className={styles.ratingLabel}>Qualité-prix</div>
                                    <div className={styles.ratingValue}>{listing.ratings.average.toFixed(1)}</div>
                                    <div className={styles.ratingBar}>
                                        <div className={styles.ratingBarFill} style={{ width: `${(listing.ratings.average / 5) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section Avis */}
                {reviews.length > 0 && (
                    <div className={styles.reviewsSection}>
                        <div className={styles.reviewsHeader}>
                            <Star size={28} fill="#FFD700" color="#FFD700" />
                            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>
                                {listing.ratings.average.toFixed(1)} · {listing.ratings.count} avis
                            </h2>
                        </div>

                        <div className={styles.reviewsGrid}>
                            {reviews.map((review) => {
                                const reviewerName = `${review.reviewer.firstName} ${review.reviewer.lastName}`;
                                const reviewerInitial = review.reviewer.firstName[0].toUpperCase();
                                const reviewDate = new Date(review.createdAt);
                                const now = new Date();
                                const diffTime = Math.abs(now.getTime() - reviewDate.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                let timeAgo = '';
                                if (diffDays < 7) {
                                    timeAgo = `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                                } else if (diffDays < 30) {
                                    const weeks = Math.floor(diffDays / 7);
                                    timeAgo = `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
                                } else if (diffDays < 365) {
                                    const months = Math.floor(diffDays / 30);
                                    timeAgo = `Il y a ${months} mois`;
                                } else {
                                    const years = Math.floor(diffDays / 365);
                                    timeAgo = `Il y a ${years} an${years > 1 ? 's' : ''}`;
                                }

                                return (
                                    <div key={review._id} className={styles.reviewCard}>
                                        <div className={styles.reviewHeader}>
                                            {review.reviewer.avatar ? (
                                                <img 
                                                    src={review.reviewer.avatar} 
                                                    alt={reviewerName}
                                                    className={styles.reviewAvatar}
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className={styles.reviewAvatar}>{reviewerInitial}</div>
                                            )}
                                            <div className={styles.reviewAuthor}>
                                                <div className={styles.reviewName}>{reviewerName}</div>
                                                <div className={styles.reviewDate}>{timeAgo}</div>
                                            </div>
                                        </div>
                                        <div className={styles.reviewRating}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    size={14} 
                                                    fill={i < review.rating ? "#FFD700" : "none"} 
                                                    color="#FFD700" 
                                                />
                                            ))}
                                        </div>
                                        <p className={styles.reviewText}>
                                            {review.comment}
                                        </p>
                                        {review.comment && review.comment.length > 150 && (
                                            <span className={styles.reviewReadMore}>Lire la suite</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Section Calendrier de disponibilité */}
                <div className={styles.availabilitySection}>
                    <div className={styles.availabilityHeader}>
                        <h2 className={styles.availabilityTitle}>
                            {listing.availability.minNights} nuit{listing.availability.minNights > 1 ? 's' : ''} à {listing.address.city}
                        </h2>
                        {(dateRange[0] || dateRange[1]) && (
                            <button 
                                className={styles.clearDatesBtn}
                                onClick={() => setDateRange([null, null])}
                            >
                                Effacer les dates
                            </button>
                        )}
                    </div>

                    <div className={styles.calendarContainer}>
                        <Calendar
                            selectRange={true}
                            onChange={(value: any) => setDateRange(value)}
                            value={dateRange}
                            minDate={new Date()}
                            locale="fr-FR"
                            prev2Label={null}
                            next2Label={null}
                            showDoubleView={window.innerWidth > 768}
                        />
                    </div>

                    {dateRange[0] && dateRange[1] && (
                        <div className={styles.selectedDatesInfo}>
                            <div style={{ marginBottom: '8px', fontWeight: '600', color: '#111827' }}>
                                Dates sélectionnées
                            </div>
                            <div>
                                {dateRange[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                {' - '}
                                {dateRange[1].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                            <div style={{ marginTop: '8px' }}>
                                {Math.ceil((dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24))} nuit(s)
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.gridLayout} style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
                    {/* Left Column */}
                    <div>
                        {/* Host Info */}
                        <div style={{ paddingBottom: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px' }}>
                                Hébergement proposé par {listing.host.firstName} {listing.host.lastName}
                            </h2>
                            <div style={{ display: 'flex', gap: '16px', color: '#6b7280' }}>
                                <span>{listing.capacity.guests} voyageurs</span>
                                <span>•</span>
                                <span>{listing.capacity.bedrooms} chambres</span>
                                <span>•</span>
                                <span>{listing.capacity.beds} lits</span>
                                <span>•</span>
                                <span>{listing.capacity.bathrooms} salles de bain</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div style={{ paddingBottom: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>Description</h3>
                            <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{listing.description}</p>
                        </div>

                        {/* Amenities */}
                        <div style={{ paddingBottom: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Équipements</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                {listing.amenities.map((amenity, idx) => {
                                    const { icon: Icon, label } = getAmenityDisplay(amenity);
                                    return (
                                        <div key={idx} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '12px',
                                            padding: '12px',
                                            background: '#f9fafb',
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '8px',
                                                background: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <Icon size={20} color="#FF385C" />
                                            </div>
                                            <span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* House Rules */}
                        <div style={{ paddingBottom: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Règlement intérieur</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Arrivée</span>
                                    <span style={{ fontWeight: '600' }}>{listing.houseRules.checkIn}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Départ</span>
                                    <span style={{ fontWeight: '600' }}>{listing.houseRules.checkOut}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {listing.houseRules.smokingAllowed ? <Check size={20} color="#10b981" /> : <X size={20} color="#ef4444" />}
                                    <span>Fumeur {listing.houseRules.smokingAllowed ? 'autorisé' : 'interdit'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {listing.houseRules.petsAllowed ? <Check size={20} color="#10b981" /> : <X size={20} color="#ef4444" />}
                                    <span>Animaux {listing.houseRules.petsAllowed ? 'autorisés' : 'interdits'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {listing.houseRules.partiesAllowed ? <Check size={20} color="#10b981" /> : <X size={20} color="#ef4444" />}
                                    <span>Fêtes {listing.houseRules.partiesAllowed ? 'autorisées' : 'interdites'}</span>
                                </div>
                                {listing.houseRules.additionalRules && (
                                    <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                                        <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>{listing.houseRules.additionalRules}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Property Details */}
                        <div style={{ paddingBottom: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Détails du logement</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                                    <HomeIcon size={20} color="#FF385C" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Type de bien</div>
                                        <div style={{ fontWeight: '600' }}>{listing.propertyType}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                                    <Users size={20} color="#FF385C" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Type de location</div>
                                        <div style={{ fontWeight: '600' }}>{listing.roomType}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                                    <Bed size={20} color="#FF385C" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Chambres / Lits</div>
                                        <div style={{ fontWeight: '600' }}>{listing.capacity.bedrooms} / {listing.capacity.beds}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                                    <Bath size={20} color="#FF385C" />
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Salles de bain</div>
                                        <div style={{ fontWeight: '600' }}>{listing.capacity.bathrooms}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Map */}
                        {listing.location?.coordinates && (
                            <div style={{ paddingBottom: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Localisation</h3>
                                <div className={styles.mapContainer}>
                                    <MapContainer
                                        center={[listing.location.coordinates[1], listing.location.coordinates[0]]}
                                        zoom={13}
                                        style={{ height: '100%', width: '100%' }}
                                        scrollWheelZoom={false}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <Marker position={[listing.location.coordinates[1], listing.location.coordinates[0]]}>
                                            <Popup>{listing.title}</Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'start', gap: '8px', color: '#6b7280' }}>
                                    <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                            {listing.address.city}, {listing.address.country}
                                        </div>
                                        {listing.address.street && (
                                            <div style={{ fontSize: '14px' }}>
                                                {listing.address.street}
                                                {listing.address.zipCode && `, ${listing.address.zipCode}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Host Information */}
                        <div style={{ paddingBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>À propos de l'hôte</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: '#f9fafb', borderRadius: '12px' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: listing.host.avatar ? `url(${listing.host.avatar}) center/cover` : '#FF385C',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '24px',
                                    fontWeight: '700'
                                }}>
                                    {!listing.host.avatar && `${listing.host.firstName[0]}${listing.host.lastName[0]}`}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                                        {listing.host.firstName} {listing.host.lastName}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Shield size={14} />
                                        <span>Hôte vérifié</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Booking Card */}
                    <div className={styles.stickyCard} style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
                        <div style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        }}>
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '28px', fontWeight: '700' }}>{listing.pricing.basePrice} {listing.pricing.currency}</span>
                                    <span style={{ color: '#6b7280' }}>/ nuit</span>
                                </div>
                                {listing.ratings.count > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                                        <Star size={14} fill="#FFD700" color="#FFD700" />
                                        <span style={{ fontWeight: '600' }}>{listing.ratings.average.toFixed(1)}</span>
                                        <span style={{ color: '#6b7280' }}>({listing.ratings.count} avis)</span>
                                    </div>
                                )}
                            </div>

                            {/* Contact Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                <a
                                    href="https://wa.me/33763223350"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '14px',
                                        background: '#25D366',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#20BA5A'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#25D366'}
                                >
                                    <MessageCircle size={20} />
                                    <span>Contacter via WhatsApp</span>
                                </a>
                                
                                <a
                                    href="tel:+33763223350"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '14px',
                                        background: '#FF385C',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#E61E4D'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#FF385C'}
                                >
                                    <Phone size={20} />
                                    <span>Appeler +33 7 63 22 33 50</span>
                                </a>
                            </div>

                            <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                                Contactez-nous pour réserver ce logement
                            </p>

                            {(listing.pricing.cleaningFee || listing.pricing.serviceFee || listing.pricing.weeklyDiscount || listing.pricing.monthlyDiscount) && (
                                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                                    {listing.pricing.cleaningFee && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                                            <span>Frais de ménage</span>
                                            <span>{listing.pricing.cleaningFee} {listing.pricing.currency}</span>
                                        </div>
                                    )}
                                    {listing.pricing.serviceFee && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                                            <span>Frais de service</span>
                                            <span>{listing.pricing.serviceFee} {listing.pricing.currency}</span>
                                        </div>
                                    )}
                                    {listing.pricing.weeklyDiscount && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#10b981' }}>
                                            <span>Réduction hebdomadaire</span>
                                            <span>-{listing.pricing.weeklyDiscount}%</span>
                                        </div>
                                    )}
                                    {listing.pricing.monthlyDiscount && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#10b981' }}>
                                            <span>Réduction mensuelle</span>
                                            <span>-{listing.pricing.monthlyDiscount}%</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                                    Séjour minimum: {listing.availability.minNights} nuit{listing.availability.minNights > 1 ? 's' : ''}
                                </div>
                                {listing.availability.maxNights && (
                                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                        Séjour maximum: {listing.availability.maxNights} nuits
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetail;
