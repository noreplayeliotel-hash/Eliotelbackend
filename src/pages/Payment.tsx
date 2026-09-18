import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle, XCircle, Loader, Calendar, MapPin } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';
import FloatingContactButtons from '../components/FloatingContactButtons';
import { STRIPE_CONFIG } from '../config/stripe';

interface BookingDetails {
    _id: string;
    listing: {
        title: string;
        images: { url: string; isPrimary: boolean }[];
        address: {
            city: string;
            country: string;
        };
    };
    guest: {
        firstName: string;
        lastName: string;
        email: string;
    };
    checkIn: string;
    checkOut: string;
    pricing: {
        basePrice: number;
        nights: number;
        subtotal: number;
        cleaningFee: number;
        serviceFee: number;
        total: number;
        currency: string;
    };
    status: string;
    paymentStatus: string;
    paymentMethod?: string;
    paymentLink?: string;
}

// Initialiser Stripe (temporairement commenté)
// const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

// Initialiser Stripe
const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

// Composant pour le formulaire de paiement Stripe
const StripePaymentForm: React.FC<{ booking: BookingDetails; onSuccess: () => void }> = ({ booking, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        const cardElement = elements.getElement(CardElement);

        if (!cardElement) {
            setError('Élément de carte non trouvé');
            setProcessing(false);
            return;
        }

        try {
            console.log('🚀 Tentative de création PaymentIntent pour booking:', booking._id);
            
            // Créer un PaymentIntent côté serveur
            const response = await api.post(`/bookings/${booking._id}/create-payment-intent`);
            
            console.log('📡 Réponse API complète:', response);
            console.log('📦 Data reçue:', response.data);
            
            // Vérifier la structure de la réponse
            if (!response.data || !response.data.data || !response.data.data.clientSecret) {
                console.error('❌ Structure de réponse invalide:', response.data);
                setError('Erreur: Réponse API invalide - clientSecret manquant');
                return;
            }
            
            const { clientSecret } = response.data.data;
            console.log('🔑 ClientSecret reçu:', clientSecret);
            
            // Confirmer le paiement
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: `${booking.guest.firstName} ${booking.guest.lastName}`,
                        email: booking.guest.email,
                    },
                },
            });

            if (stripeError) {
                console.error('❌ Erreur Stripe:', stripeError);
                setError(stripeError.message || 'Erreur de paiement');
            } else if (paymentIntent?.status === 'succeeded') {
                console.log('✅ Paiement réussi:', paymentIntent);
                
                // Mettre à jour le statut de la réservation côté serveur
                try {
                    console.log('🔄 Mise à jour du statut de réservation...');
                    await api.post(`/bookings/${booking._id}/confirm-stripe-payment`, {
                        paymentIntentId: paymentIntent.id
                    });
                    console.log('✅ Statut de réservation mis à jour');
                    onSuccess();
                } catch (updateError: any) {
                    console.error('❌ Erreur mise à jour statut:', updateError);
                    // Le paiement a réussi mais la mise à jour a échoué
                    setError('Paiement réussi mais erreur de mise à jour. Contactez le support.');
                }
            }
        } catch (err: any) {
            console.error('❌ Erreur API:', err);
            console.error('❌ Détails erreur:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message
            });
            
            const errorMessage = err.response?.data?.message || err.response?.data?.details || err.message || 'Erreur lors du paiement';
            setError(`Erreur: ${errorMessage}`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                        },
                    }}
                />
            </div>
            
            {error && (
                <div style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    fontSize: '14px'
                }}>
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={processing}
                style={{
                    width: '100%',
                    padding: '16px',
                    background: processing ? '#d1d5db' : '#FF385C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: processing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}
            >
                {processing ? (
                    <>
                        <Loader size={20} className="spinner" />
                        Traitement...
                    </>
                ) : (
                    <>
                        <CreditCard size={20} />
                        Payer {booking.pricing.total} {booking.pricing.currency}
                    </>
                )}
            </button>
        </form>
    );
};

const Payment: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const [searchParams] = useSearchParams();
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [konnectPayUrl, setKonnectPayUrl] = useState<string | null>(null);
    const [initializingPayment, setInitializingPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<string>('');

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/bookings/${bookingId}/payment-info`);
                const bookingData = response.data.data;
                setBooking(bookingData);
                
                // Déterminer la méthode de paiement depuis l'URL ou les données de réservation
                const methodFromUrl = searchParams.get('method');
                const method = methodFromUrl || bookingData.paymentMethod || 'konnect';
                
                console.log('🔍 Détection méthode de paiement:');
                console.log('- URL method:', methodFromUrl);
                console.log('- Booking paymentMethod:', bookingData.paymentMethod);
                console.log('- Méthode finale:', method);
                
                setPaymentMethod(method);
                
            } catch (err: any) {
                setError(err.response?.data?.message || 'Erreur lors du chargement de la réservation');
            } finally {
                setLoading(false);
            }
        };

        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId, searchParams]);

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #FF385C 0%, #E61E4D 50%, #C13584 100%)'
            }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <Loader size={48} className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ fontSize: '18px' }}>Chargement...</p>
                </div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #FF385C 0%, #E61E4D 50%, #C13584 100%)',
                padding: '20px'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '40px',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                    <XCircle size={64} color="#dc2626" style={{ margin: '0 auto 24px' }} />
                    <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
                        Réservation introuvable
                    </h1>
                    <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                        {error || 'Cette réservation n\'existe pas ou a été supprimée.'}
                    </p>
                </div>
            </div>
        );
    }

    const primaryImage = booking.listing.images.find(img => img.isPrimary)?.url || booking.listing.images[0]?.url;
    const checkInDate = new Date(booking.checkIn).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    const checkOutDate = new Date(booking.checkOut).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });

    const isPaid = booking.paymentStatus === 'paid';

    const handleInitPayment = async () => {
        try {
            setInitializingPayment(true);
            
            console.log('🚀 Initialisation du paiement avec méthode:', paymentMethod);
            
            if (paymentMethod === 'stripe') {
                console.log('✅ Affichage du formulaire Stripe');
                setShowPaymentForm(true);
            } else {
                console.log('🏦 Initialisation du paiement Konnect');
                // Konnect payment
                const response = await api.post(`/bookings/${bookingId}/init-payment`);
                setKonnectPayUrl(response.data.data.payUrl);
                setShowPaymentForm(true);
            }
        } catch (err: any) {
            console.error('❌ Erreur initialisation paiement:', err);
            alert('Erreur lors de l\'initialisation du paiement: ' + (err.response?.data?.message || err.message));
        } finally {
            setInitializingPayment(false);
        }
    };

    const handlePaymentSuccess = () => {
        // Recharger les données de réservation pour voir le statut mis à jour
        window.location.reload();
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: showPaymentForm ? 'white' : 'linear-gradient(135deg, #FF385C 0%, #E61E4D 50%, #C13584 100%)'
        }}>
            <FloatingContactButtons />
            
            {!showPaymentForm ? (
                // Page de détails - Layout 2 colonnes sur desktop
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: window.innerWidth >= 768 ? 'row' : 'column'
                }}>
                    {/* Colonne gauche - Image (Desktop) / Header (Mobile) */}
                    <div style={{
                        flex: window.innerWidth >= 768 ? '1' : 'none',
                        minHeight: window.innerWidth >= 768 ? '100vh' : '300px',
                        background: `url(${primaryImage}) center/cover`,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-end'
                    }}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
                        }} />
                        <div style={{ 
                            position: 'relative', 
                            zIndex: 1, 
                            color: 'white', 
                            padding: '40px',
                            width: '100%'
                        }}>
                            <h1 style={{ 
                                fontSize: 'clamp(28px, 5vw, 42px)', 
                                fontWeight: '700', 
                                marginBottom: '12px', 
                                lineHeight: '1.2' 
                            }}>
                                {booking.listing.title}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                                <MapPin size={20} />
                                {booking.listing.address.city}, {booking.listing.address.country}
                            </div>
                        </div>
                    </div>

                    {/* Colonne droite - Contenu */}
                    <div style={{
                        flex: window.innerWidth >= 768 ? '1' : 'none',
                        background: 'white',
                        padding: window.innerWidth >= 768 ? '48px' : '24px',
                        overflowY: 'auto',
                        maxHeight: window.innerWidth >= 768 ? '100vh' : 'none'
                    }}>
                        {/* Statut */}
                        {isPaid ? (
                            <div style={{
                                background: '#f0fdf4',
                                border: '1px solid #86efac',
                                borderRadius: '8px',
                                padding: '16px 20px',
                                marginBottom: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <CheckCircle size={24} color="#16a34a" />
                                <div>
                                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#16a34a', margin: 0 }}>
                                        Paiement effectué
                                    </p>
                                    <p style={{ fontSize: '14px', color: '#15803d', margin: '4px 0 0 0' }}>
                                        Votre réservation est confirmée
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    background: '#fff7ed',
                                    border: '1px solid #fed7aa',
                                    borderRadius: '8px',
                                    padding: '16px 20px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <CreditCard size={24} color="#ea580c" />
                                    <div>
                                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#ea580c', margin: 0 }}>
                                            Paiement en attente
                                        </p>
                                        <p style={{ fontSize: '14px', color: '#9a3412', margin: '4px 0 0 0' }}>
                                            Finalisez votre réservation
                                        </p>
                                    </div>
                                </div>

                                {/* Indicateur de méthode de paiement */}
                                <div style={{
                                    background: '#f3f4f6',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    marginBottom: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span style={{ fontSize: '16px' }}>
                                        {paymentMethod === 'stripe' ? '💳' : paymentMethod === 'konnect' ? '🏦' : '💵'}
                                    </span>
                                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                                        Méthode de paiement: {' '}
                                        <strong style={{ color: '#111827' }}>
                                            {paymentMethod === 'stripe' ? 'Stripe (Carte bancaire)' : 
                                             paymentMethod === 'konnect' ? 'Konnect (Mobile TN)' : 
                                             'Espèces'}
                                        </strong>
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Voyageur */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px'
                                }}>
                                    👤
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#111827' }}>
                                    Voyageur
                                </h3>
                            </div>
                            <div style={{
                                background: '#fafafa',
                                borderRadius: '8px',
                                padding: '16px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <p style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px', color: '#111827' }}>
                                    {booking.guest.firstName} {booking.guest.lastName}
                                </p>
                                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                                    {booking.guest.email}
                                </p>
                            </div>
                        </div>

                        {/* Dates */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px'
                                }}>
                                    📅
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#111827' }}>
                                    Dates du séjour
                                </h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{
                                    background: '#fafafa',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
                                        Arrivée
                                    </p>
                                    <p style={{ fontSize: '15px', fontWeight: '500', margin: 0, color: '#111827' }}>
                                        {checkInDate}
                                    </p>
                                </div>
                                <div style={{
                                    background: '#fafafa',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
                                        Départ
                                    </p>
                                    <p style={{ fontSize: '15px', fontWeight: '500', margin: 0, color: '#111827' }}>
                                        {checkOutDate}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Prix */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px'
                                }}>
                                    💰
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#111827' }}>
                                    Détails du prix
                                </h3>
                            </div>
                            <div style={{
                                background: '#fafafa',
                                borderRadius: '8px',
                                padding: '20px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '12px',
                                    fontSize: '14px',
                                    color: '#6b7280'
                                }}>
                                    <span>{booking.pricing.basePrice} {booking.pricing.currency} × {booking.pricing.nights} nuit{booking.pricing.nights > 1 ? 's' : ''}</span>
                                    <span style={{ fontWeight: '500', color: '#111827' }}>{booking.pricing.subtotal} {booking.pricing.currency}</span>
                                </div>
                                {booking.pricing.cleaningFee > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '12px',
                                        fontSize: '14px',
                                        color: '#6b7280'
                                    }}>
                                        <span>Frais de ménage</span>
                                        <span style={{ fontWeight: '500', color: '#111827' }}>{booking.pricing.cleaningFee} {booking.pricing.currency}</span>
                                    </div>
                                )}
                                {booking.pricing.serviceFee > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '12px',
                                        fontSize: '14px',
                                        color: '#6b7280'
                                    }}>
                                        <span>Frais de service</span>
                                        <span style={{ fontWeight: '500', color: '#111827' }}>{booking.pricing.serviceFee} {booking.pricing.currency}</span>
                                    </div>
                                )}
                                <div style={{
                                    borderTop: '1px solid #e5e7eb',
                                    marginTop: '16px',
                                    paddingTop: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Total</span>
                                    <span style={{ fontSize: '24px', fontWeight: '700', color: '#FF385C' }}>
                                        {booking.pricing.total} {booking.pricing.currency}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bouton */}
                        {!isPaid && (
                            <button
                                onClick={handleInitPayment}
                                disabled={initializingPayment}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '16px',
                                    background: initializingPayment ? '#d1d5db' : '#FF385C',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: initializingPayment ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!initializingPayment) {
                                        e.currentTarget.style.background = '#E31C5F';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!initializingPayment) {
                                        e.currentTarget.style.background = '#FF385C';
                                    }
                                }}
                            >
                                {initializingPayment ? (
                                    <>
                                        <Loader size={20} className="spinner" />
                                        Initialisation...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard size={20} />
                                        {paymentMethod === 'stripe' ? 'PAYER PAR CARTE' : 'PAYER AVEC KONNECT'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                // Formulaire de paiement - Layout 2 colonnes sur desktop
                <div style={{ 
                    minHeight: '100vh', 
                    display: 'flex', 
                    flexDirection: window.innerWidth >= 768 ? 'row' : 'column',
                    background: 'white'
                }}>
                    {/* Colonne gauche - Infos (Desktop only) */}
                    {window.innerWidth >= 768 && (
                        <div style={{
                            width: '400px',
                            background: 'linear-gradient(135deg, #FF385C 0%, #E61E4D 50%, #C13584 100%)',
                            padding: '40px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px'
                        }}>
                            {/* Image */}
                            <div style={{
                                borderRadius: '16px',
                                overflow: 'hidden',
                                height: '250px',
                                background: `url(${primaryImage}) center/cover`,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                            }} />
                            
                            {/* Infos */}
                            <div style={{ color: 'white' }}>
                                <h2 style={{ 
                                    fontSize: '24px', 
                                    fontWeight: '700', 
                                    marginBottom: '12px',
                                    lineHeight: '1.3'
                                }}>
                                    {booking.listing.title}
                                </h2>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    marginBottom: '24px',
                                    opacity: 0.95
                                }}>
                                    <MapPin size={18} />
                                    <span style={{ fontSize: '16px' }}>
                                        {booking.listing.address.city}, {booking.listing.address.country}
                                    </span>
                                </div>
                                
                                {/* Prix */}
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}>
                                    <p style={{ 
                                        fontSize: '14px', 
                                        marginBottom: '8px',
                                        opacity: 0.9
                                    }}>
                                        Montant total
                                    </p>
                                    <p style={{ 
                                        fontSize: '36px', 
                                        fontWeight: '700', 
                                        margin: 0 
                                    }}>
                                        {booking.pricing.total} {booking.pricing.currency}
                                    </p>
                                </div>

                                {/* Dates */}
                                <div style={{
                                    marginTop: '20px',
                                    padding: '16px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.15)'
                                }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px',
                                        marginBottom: '8px'
                                    }}>
                                        <Calendar size={16} />
                                        <span style={{ fontSize: '14px', opacity: 0.9 }}>
                                            {checkInDate}
                                        </span>
                                    </div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px'
                                    }}>
                                        <Calendar size={16} />
                                        <span style={{ fontSize: '14px', opacity: 0.9 }}>
                                            {checkOutDate}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bouton retour */}
                            <button
                                onClick={() => {
                                    setShowPaymentForm(false);
                                    setKonnectPayUrl(null);
                                }}
                                style={{
                                    marginTop: 'auto',
                                    padding: '12px 24px',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                ← Retour
                            </button>
                        </div>
                    )}

                    {/* Header mobile */}
                    {window.innerWidth < 768 && (
                        <div style={{
                            padding: '16px',
                            background: 'white',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                                    {booking.listing.title}
                                </p>
                                <p style={{ fontSize: '20px', fontWeight: '700', color: '#FF385C', margin: 0 }}>
                                    {booking.pricing.total} {booking.pricing.currency}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowPaymentForm(false);
                                    setKonnectPayUrl(null);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: '#f3f4f6',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Retour
                            </button>
                        </div>
                    )}

                    {/* Colonne droite - Formulaire de paiement */}
                    <div style={{ flex: 1, padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {paymentMethod === 'stripe' ? (
                            <div style={{ width: '100%', maxWidth: '500px' }}>
                                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                    <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                                        Paiement sécurisé Stripe
                                    </h2>
                                    <p style={{ color: '#6b7280', fontSize: '16px' }}>
                                        Payez en toute sécurité avec Stripe
                                    </p>
                                    <div style={{
                                        background: '#e0f2fe',
                                        border: '2px solid #0284c7',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        marginTop: '16px',
                                        fontSize: '14px',
                                        color: '#0c4a6e'
                                    }}>
                                        ✅ <strong>Méthode Stripe détectée correctement !</strong><br/>
                                        Le formulaire de paiement Stripe s'affichera ici une fois les dépendances installées.
                                    </div>
                                </div>
                                <Elements stripe={stripePromise}>
                                    <StripePaymentForm booking={booking} onSuccess={handlePaymentSuccess} />
                                </Elements>
                            </div>
                        ) : (
                            // Iframe Konnect
                            <div style={{ width: '100%' }}>
                                <div style={{
                                    background: '#fef3c7',
                                    border: '2px solid #f59e0b',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '16px',
                                    fontSize: '14px',
                                    color: '#92400e',
                                    textAlign: 'center'
                                }}>
                                    🏦 <strong>Méthode Konnect détectée !</strong><br/>
                                    Iframe de paiement Konnect ci-dessous.
                                </div>
                                {konnectPayUrl && (
                                    <iframe
                                        src={konnectPayUrl}
                                        style={{
                                            width: '100%',
                                            height: window.innerWidth >= 768 ? '100vh' : 'calc(100vh - 80px)',
                                            border: 'none',
                                            display: 'block'
                                        }}
                                        title="Formulaire de paiement Konnect"
                                        allow="payment"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payment;
