import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Plus, UserPlus, Search, ChevronDown } from 'lucide-react';
import type { User, Listing } from '../../types';
import styles from './BookingModals.module.css';

interface CreateBookingModalProps {
    show: boolean;
    onClose: () => void;
    users: User[];
    listings: Listing[];
    selectedUserId: string;
    setSelectedUserId: (value: string) => void;
    selectedListingId: string;
    setSelectedListingId: (value: string) => void;
    bookingCheckIn: string;
    setBookingCheckIn: (value: string) => void;
    bookingCheckOut: string;
    setBookingCheckOut: (value: string) => void;
    bookingGuests: number;
    setBookingGuests: (value: number) => void;
    paymentMethod: string;
    setPaymentMethod: (value: string) => void;
    onCreateBooking: () => void;
    onShowCreateUser: () => void;
    isCreating: boolean;
}

// Composant de recherche d'utilisateur
const UserSearchField: React.FC<{
    users: User[];
    selectedUserId: string;
    onSelect: (userId: string) => void;
    onShowCreateUser: () => void;
}> = ({ users, selectedUserId, onSelect, onShowCreateUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedUser = users.find(u => u._id === selectedUserId);

    useEffect(() => {
        if (searchTerm) {
            const filtered = users.filter(user =>
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchTerm, users]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (user: User) => {
        onSelect(user._id);
        setSearchTerm('');
        setIsOpen(false);
    };

    const displayValue = selectedUser 
        ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`
        : '';

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div className={styles.fieldGroup}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder={selectedUser ? displayValue : "Rechercher un utilisateur..."}
                        value={isOpen ? searchTerm : (selectedUser ? displayValue : '')}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        style={{ 
                            paddingRight: '40px',
                            borderColor: selectedUserId ? 'var(--success)' : 'var(--border)'
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <Search size={16} color="var(--light)" />
                        <ChevronDown size={16} color="var(--light)" />
                    </div>
                </div>
                <button className={styles.newUserButton} onClick={onShowCreateUser}>
                    <Plus size={16} />
                    Nouveau
                </button>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    marginTop: '4px'
                }}>
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <div
                                key={user._id}
                                onClick={() => handleSelect(user)}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border-light)',
                                    transition: 'background-color 0.2s',
                                    backgroundColor: selectedUserId === user._id ? 'var(--primary-light)' : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedUserId !== user._id) {
                                        e.currentTarget.style.backgroundColor = 'var(--background-light)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedUserId !== user._id) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <div style={{ fontWeight: '500', fontSize: '14px' }}>
                                    {user.firstName} {user.lastName}
                                </div>
                                <div style={{ color: 'var(--light)', fontSize: '12px', marginTop: '2px' }}>
                                    {user.email}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{
                            padding: '16px',
                            textAlign: 'center',
                            color: 'var(--light)',
                            fontSize: '14px'
                        }}>
                            Aucun utilisateur trouvé
                        </div>
                    )}
                </div>
            )}

            {selectedUserId && (
                <div className={styles.successBadge}>
                    <Check size={14} />
                    Utilisateur sélectionné
                </div>
            )}
        </div>
    );
};

// Composant de recherche de listing
const ListingSearchField: React.FC<{
    listings: Listing[];
    selectedListingId: string;
    onSelect: (listingId: string) => void;
}> = ({ listings, selectedListingId, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedListing = listings.find(l => l._id === selectedListingId);

    useEffect(() => {
        if (searchTerm) {
            const filtered = listings.filter(listing =>
                listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                listing.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                listing.address.country.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredListings(filtered);
        } else {
            setFilteredListings(listings);
        }
    }, [searchTerm, listings]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (listing: Listing) => {
        onSelect(listing._id);
        setSearchTerm('');
        setIsOpen(false);
    };

    const displayValue = selectedListing 
        ? `${selectedListing.title} - ${selectedListing.pricing.basePrice} ${selectedListing.pricing.currency}/nuit`
        : '';

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    className="input-field"
                    placeholder={selectedListing ? displayValue : "Rechercher une annonce..."}
                    value={isOpen ? searchTerm : (selectedListing ? displayValue : '')}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    style={{ 
                        paddingRight: '40px',
                        borderColor: selectedListingId ? 'var(--success)' : 'var(--border)'
                    }}
                />
                <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <Search size={16} color="var(--light)" />
                    <ChevronDown size={16} color="var(--light)" />
                </div>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    marginTop: '4px'
                }}>
                    {filteredListings.length > 0 ? (
                        filteredListings.map((listing) => (
                            <div
                                key={listing._id}
                                onClick={() => handleSelect(listing)}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border-light)',
                                    transition: 'background-color 0.2s',
                                    backgroundColor: selectedListingId === listing._id ? 'var(--primary-light)' : 'transparent',
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedListingId !== listing._id) {
                                        e.currentTarget.style.backgroundColor = 'var(--background-light)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedListingId !== listing._id) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                {listing.images[0] && (
                                    <img
                                        src={listing.images.find(img => img.isPrimary)?.url || listing.images[0].url}
                                        alt={listing.title}
                                        style={{
                                            width: '50px',
                                            height: '40px',
                                            objectFit: 'cover',
                                            borderRadius: '6px',
                                            flexShrink: 0
                                        }}
                                    />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ 
                                        fontWeight: '500', 
                                        fontSize: '14px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {listing.title}
                                    </div>
                                    <div style={{ 
                                        color: 'var(--light)', 
                                        fontSize: '12px', 
                                        marginTop: '2px' 
                                    }}>
                                        {listing.address.city}, {listing.address.country}
                                    </div>
                                    <div style={{ 
                                        color: 'var(--primary)', 
                                        fontSize: '12px', 
                                        fontWeight: '600',
                                        marginTop: '2px'
                                    }}>
                                        {listing.pricing.basePrice} {listing.pricing.currency}/nuit
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{
                            padding: '16px',
                            textAlign: 'center',
                            color: 'var(--light)',
                            fontSize: '14px'
                        }}>
                            Aucune annonce trouvée
                        </div>
                    )}
                </div>
            )}

            {selectedListing && (
                <div className={styles.listingPreview}>
                    {selectedListing.images[0] && (
                        <img
                            src={selectedListing.images.find(img => img.isPrimary)?.url || selectedListing.images[0].url}
                            alt={selectedListing.title}
                            className={styles.listingImage}
                        />
                    )}
                    <div className={styles.listingInfo}>
                        <p className={styles.listingTitle}>{selectedListing.title}</p>
                        <p className={styles.listingLocation}>
                            {selectedListing.address.city}, {selectedListing.address.country}
                        </p>
                        <p className={styles.listingPrice}>
                            {selectedListing.pricing.basePrice} {selectedListing.pricing.currency}/nuit
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const CreateBookingModal: React.FC<CreateBookingModalProps> = ({
    show,
    onClose,
    users,
    listings,
    selectedUserId,
    setSelectedUserId,
    selectedListingId,
    setSelectedListingId,
    bookingCheckIn,
    setBookingCheckIn,
    bookingCheckOut,
    setBookingCheckOut,
    bookingGuests,
    setBookingGuests,
    paymentMethod,
    setPaymentMethod,
    onCreateBooking,
    onShowCreateUser,
    isCreating
}) => {
    if (!show) return null;

    const selectedListing = listings.find(l => l._id === selectedListingId);

    return (
        <>
            <div className={styles.modalOverlay} onClick={onClose} />
            <div className={styles.modalContainer}>
                <div className={styles.modalContent}>
                    <div className={`${styles.modalHeader} ${styles.modalHeaderPrimary}`}>
                        <div>
                            <h2 className={styles.modalTitle}>Nouvelle réservation</h2>
                            <p className={styles.modalSubtitle}>Créez une réservation pour un voyageur</p>
                        </div>
                        <button className={styles.closeButton} onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className={styles.modalBody}>
                        <div className={styles.formContainer}>
                            {/* Sélection utilisateur */}
                            <div>
                                <label className="input-label">
                                    <span className={styles.labelWithIcon}>
                                        <UserPlus size={16} color="var(--primary)" />
                                        Voyageur <span style={{ color: 'var(--error)' }}>*</span>
                                    </span>
                                </label>
                                <UserSearchField
                                    users={users}
                                    selectedUserId={selectedUserId}
                                    onSelect={setSelectedUserId}
                                    onShowCreateUser={onShowCreateUser}
                                />
                            </div>

                            {/* Sélection annonce */}
                            <div>
                                <label className="input-label">
                                    Annonce <span style={{ color: 'var(--error)' }}>*</span>
                                </label>
                                <ListingSearchField
                                    listings={listings}
                                    selectedListingId={selectedListingId}
                                    onSelect={setSelectedListingId}
                                />
                            </div>

                            {/* Dates */}
                            <div className={styles.datesSection}>
                                <div>
                                    <label className="input-label" style={{ fontSize: '13px' }}>
                                        Check-in <span style={{ color: 'var(--error)' }}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={bookingCheckIn}
                                        onChange={(e) => setBookingCheckIn(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div>
                                    <label className="input-label" style={{ fontSize: '13px' }}>
                                        Check-out <span style={{ color: 'var(--error)' }}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={bookingCheckOut}
                                        onChange={(e) => setBookingCheckOut(e.target.value)}
                                        min={bookingCheckIn || new Date().toISOString().split('T')[0]}
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                            </div>

                            {/* Nombre de voyageurs */}
                            <div>
                                <label className="input-label">Nombre de voyageurs</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={bookingGuests}
                                    onChange={(e) => setBookingGuests(parseInt(e.target.value))}
                                    min="1"
                                    max={selectedListing?.capacity.guests || 10}
                                    style={{ marginBottom: 0 }}
                                />
                                {selectedListing && (
                                    <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--light)' }}>
                                        Capacité maximale: {selectedListing.capacity.guests} voyageurs
                                    </p>
                                )}
                            </div>

                            {/* Méthode de paiement */}
                            <div>
                                <label className="input-label">
                                    Méthode de paiement <span style={{ color: 'var(--error)' }}>*</span>
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div 
                                        className={`${styles.paymentOption} ${paymentMethod === 'cash' ? styles.paymentOptionSelected : ''}`}
                                        onClick={() => setPaymentMethod('cash')}
                                    >
                                        <div className={styles.paymentIcon}>💵</div>
                                        <div className={styles.paymentLabel}>Espèces</div>
                                        <div className={styles.paymentDescription}>Paiement en liquide</div>
                                    </div>
                                    <div 
                                        className={`${styles.paymentOption} ${paymentMethod === 'konnect' ? styles.paymentOptionSelected : ''}`}
                                        onClick={() => setPaymentMethod('konnect')}
                                    >
                                        <div className={styles.paymentIcon}>🏦</div>
                                        <div className={styles.paymentLabel}>Konnect</div>
                                        <div className={styles.paymentDescription}>Paiement mobile TN</div>
                                    </div>
                                    <div 
                                        className={`${styles.paymentOption} ${paymentMethod === 'stripe' ? styles.paymentOptionSelected : ''}`}
                                        onClick={() => setPaymentMethod('stripe')}
                                    >
                                        <div className={styles.paymentIcon}>💳</div>
                                        <div className={styles.paymentLabel}>Stripe</div>
                                        <div className={styles.paymentDescription}>Carte bancaire</div>
                                    </div>
                                </div>
                                {paymentMethod === 'stripe' && (
                                    <div style={{ 
                                        marginTop: '8px', 
                                        padding: '8px 12px', 
                                        backgroundColor: '#f8f9fa', 
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        color: 'var(--light)'
                                    }}>
                                        ℹ️ Le paiement Stripe sera traité via notre passerelle sécurisée
                                    </div>
                                )}
                            </div>

                            {/* Résumé du prix */}
                            {selectedListing && bookingCheckIn && bookingCheckOut && (
                                <div className={styles.priceSummary}>
                                    <h3 className={styles.priceSummaryTitle}>💰 Résumé du prix</h3>
                                    {(() => {
                                        const checkInDate = new Date(bookingCheckIn);
                                        const checkOutDate = new Date(bookingCheckOut);
                                        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
                                        const subtotal = selectedListing.pricing.basePrice * nights;
                                        const cleaningFee = selectedListing.pricing.cleaningFee || 0;
                                        const serviceFee = selectedListing.pricing.serviceFee || 0;
                                        const total = subtotal + cleaningFee + serviceFee;

                                        return (
                                            <div className={styles.priceDetails}>
                                                <div className={styles.priceRow}>
                                                    <span>
                                                        {selectedListing.pricing.basePrice} {selectedListing.pricing.currency} × {nights} nuit{nights > 1 ? 's' : ''}
                                                    </span>
                                                    <span style={{ fontWeight: '600' }}>{subtotal} {selectedListing.pricing.currency}</span>
                                                </div>
                                                {cleaningFee > 0 && (
                                                    <div className={styles.priceRow}>
                                                        <span>Frais de ménage</span>
                                                        <span style={{ fontWeight: '600' }}>{cleaningFee} {selectedListing.pricing.currency}</span>
                                                    </div>
                                                )}
                                                {serviceFee > 0 && (
                                                    <div className={styles.priceRow}>
                                                        <span>Frais de service</span>
                                                        <span style={{ fontWeight: '600' }}>{serviceFee} {selectedListing.pricing.currency}</span>
                                                    </div>
                                                )}
                                                <div className={styles.priceTotal}>
                                                    <span className={styles.priceTotalLabel}>Total</span>
                                                    <span className={styles.priceTotalValue}>
                                                        {total} {selectedListing.pricing.currency}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Boutons d'action */}
                            <div className={styles.modalFooter}>
                                <button className={styles.buttonCancel} onClick={onClose}>
                                    Annuler
                                </button>
                                <button
                                    className={`${styles.buttonSubmit} ${styles.buttonSubmitPrimary}`}
                                    onClick={onCreateBooking}
                                    disabled={isCreating}
                                >
                                    {isCreating ? (
                                        <>
                                            <span className={styles.spinner} />
                                            Création...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            Créer la réservation
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateBookingModal;
