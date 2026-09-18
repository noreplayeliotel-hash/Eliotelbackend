import React, { useState } from 'react';
import { Copy, CheckCircle, Phone, Mail, Trash2, Edit2, Check, X } from 'lucide-react';
import type { Booking } from '../../types';

interface BookingCardProps {
    booking: Booking;
    translateStatus: (status: string) => string;
    getStatusColor: (status: string) => string;
    // Dates
    editingDates: string | null;
    editCheckIn: string;
    editCheckOut: string;
    setEditCheckIn: (value: string) => void;
    setEditCheckOut: (value: string) => void;
    onStartEditDates: (booking: Booking) => void;
    onSaveDates: (bookingId: string) => void;
    onCancelEdit: () => void;
    // Price
    editingPrice: string | null;
    editPrice: string;
    setEditPrice: (value: string) => void;
    onStartEditPrice: (booking: Booking) => void;
    onSavePrice: (bookingId: string) => void;
    onCancelEditPrice: () => void;
    // Other
    onStatusChange: (bookingId: string, status: string) => void;
    onPaymentStatusChange: (bookingId: string, paymentStatus: string) => void;
    onDelete: (bookingId: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
    booking,
    translateStatus,
    getStatusColor,
    editingDates,
    editCheckIn,
    editCheckOut,
    setEditCheckIn,
    setEditCheckOut,
    onStartEditDates,
    onSaveDates,
    onCancelEdit,
    editingPrice,
    editPrice,
    setEditPrice,
    onStartEditPrice,
    onSavePrice,
    onCancelEditPrice,
    onStatusChange,
    onPaymentStatusChange,
    onDelete,
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopyPaymentLink = async () => {
        if (!booking.paymentLink) return;
        try {
            await navigator.clipboard.writeText(booking.paymentLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            alert('Erreur lors de la copie du lien');
        }
    };

    const guest = typeof booking.guest === 'object' ? booking.guest : null;
    const host = typeof booking.host === 'object' ? booking.host : null;
    const listing = typeof booking.listing === 'object' ? booking.listing : null;

    return (
        <div className="booking-mobile-card" style={{ position: 'relative' }}>
            {/* Icône supprimer en haut à droite de la carte */}
            <button
                onClick={() => onDelete(booking._id)}
                className="card-delete-btn"
                title="Supprimer"
            >
                <Trash2 size={16} />
            </button>

            {/* Header : image + titre/ville */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)', paddingRight: '28px' }}>
                <img
                    src={listing ? (listing.images.find((img: any) => img.isPrimary)?.url || listing.images[0]?.url) : ''}
                    alt=""
                    className="mobile-card-image"
                    style={{ flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--dark)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing?.title || 'Annonce'}
                    </span>
                    <p style={{ fontSize: '12px', color: 'var(--light)', margin: '2px 0 0' }}>
                        {listing?.address?.city}, {listing?.address?.country}
                    </p>
                </div>
            </div>

            <div className="mobile-card-body">
                {/* Voyageur */}
                <div className="mobile-card-row" style={{ alignItems: 'flex-start' }}>
                    <span className="mobile-card-label">VOYAGEUR</span>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '600', fontSize: '14px', margin: 0 }}>
                            {guest ? `${guest.firstName} ${guest.lastName}` : '—'}
                        </p>
                        {guest?.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                                <Mail size={11} color="var(--light)" />
                                <span style={{ fontSize: '12px', color: 'var(--light)' }}>{guest.email}</span>
                            </div>
                        )}
                        {guest?.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                                <Phone size={11} color="var(--light)" />
                                <span style={{ fontSize: '12px', color: 'var(--light)' }}>{guest.phone}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hôte */}
                <div className="mobile-card-row" style={{ alignItems: 'flex-start' }}>
                    <span className="mobile-card-label">HÔTE</span>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '600', fontSize: '14px', margin: 0 }}>
                            {host ? `${host.firstName} ${host.lastName}` : '—'}
                        </p>
                        {host?.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                                <Mail size={11} color="var(--light)" />
                                <span style={{ fontSize: '12px', color: 'var(--light)' }}>{host.email}</span>
                            </div>
                        )}
                        {host?.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                                <Phone size={11} color="var(--light)" />
                                <span style={{ fontSize: '12px', color: 'var(--light)' }}>{host.phone}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dates */}
                <div className="mobile-card-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="mobile-card-label">DATES</span>
                        {editingDates !== booking._id && (
                            <button
                                onClick={() => onStartEditDates(booking)}
                                className="card-edit-btn"
                                title="Modifier les dates"
                            >
                                <Edit2 size={13} />
                            </button>
                        )}
                    </div>
                    {editingDates === booking._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                            <input type="date" className="input-field"
                                style={{ padding: '4px', fontSize: '12px', marginBottom: 0, width: '130px' }}
                                value={editCheckIn} onChange={(e) => setEditCheckIn(e.target.value)} />
                            <input type="date" className="input-field"
                                style={{ padding: '4px', fontSize: '12px', marginBottom: 0, width: '130px' }}
                                value={editCheckOut} onChange={(e) => setEditCheckOut(e.target.value)} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => onSaveDates(booking._id)} style={{ color: 'var(--success)', border: 'none', background: 'none', cursor: 'pointer' }}><Check size={18} /></button>
                                <button onClick={onCancelEdit} style={{ color: 'var(--error)', border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
                            </div>
                        </div>
                    ) : (
                        <span className="mobile-card-value" style={{ textAlign: 'right' }}>
                            {new Date(booking.checkIn).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            <br />
                            <span style={{ fontSize: '12px', color: 'var(--light)' }}>
                                au {new Date(booking.checkOut).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                        </span>
                    )}
                </div>

                {/* Total */}
                <div className="mobile-card-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="mobile-card-label">TOTAL</span>
                        {editingPrice !== booking._id && (
                            <button
                                onClick={() => onStartEditPrice(booking)}
                                className="card-edit-btn"
                                title="Modifier le prix"
                            >
                                <Edit2 size={13} />
                            </button>
                        )}
                    </div>
                    {editingPrice === booking._id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input type="number" className="input-field" min="0" step="0.01"
                                style={{ padding: '4px', fontSize: '12px', marginBottom: 0, width: '80px' }}
                                value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                            <button onClick={() => onSavePrice(booking._id)} style={{ color: 'var(--success)', border: 'none', background: 'none', cursor: 'pointer' }}><Check size={18} /></button>
                            <button onClick={onCancelEditPrice} style={{ color: 'var(--error)', border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                    ) : (
                        <span className="mobile-card-value mobile-card-value-bold">
                            {booking.pricing.total} {booking.pricing.currency}
                        </span>
                    )}
                </div>

                {/* Statut réservation */}
                <div className="mobile-card-row">
                    <span className="mobile-card-label">STATUT</span>
                    <span className={`status-badge ${getStatusColor(booking.status)}`}>
                        {translateStatus(booking.status)}
                    </span>
                </div>

                {/* Méthode paiement */}
                <div className="mobile-card-row">
                    <span className="mobile-card-label">MÉTHODE</span>
                    <span style={{
                        fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600',
                        background: (!booking.paymentMethod || booking.paymentMethod === 'cash') ? '#fef9c3' : '#eff6ff',
                        color: (!booking.paymentMethod || booking.paymentMethod === 'cash') ? '#854d0e' : '#1d4ed8',
                        border: `1px solid ${(!booking.paymentMethod || booking.paymentMethod === 'cash') ? '#fde047' : '#bfdbfe'}`
                    }}>
                        {booking.paymentMethod === 'stripe' ? '💳 Carte' : booking.paymentMethod === 'konnect' ? '🏦 Konnect' : '💵 Espèce'}
                    </span>
                </div>

                {/* Statut paiement */}
                <div className="mobile-card-row">
                    <span className="mobile-card-label">PAIEMENT</span>
                    <select
                        value={booking.paymentStatus}
                        onChange={(e) => onPaymentStatusChange(booking._id, e.target.value)}
                        className="mobile-card-select"
                        style={{ width: 'auto', minWidth: '110px' }}
                    >
                        <option value="pending">En attente</option>
                        <option value="paid">Payé</option>
                        <option value="refunded">Remboursé</option>
                        <option value="failed">Échoué</option>
                    </select>
                </div>

                {/* Lien de paiement */}
                {booking.paymentLink && (
                    <div className="mobile-card-row">
                        <span className="mobile-card-label">LIEN PAIEMENT</span>
                        <button
                            onClick={handleCopyPaymentLink}
                            style={{
                                padding: '6px 12px',
                                background: copied ? '#dcfce7' : '#f0f9ff',
                                border: `1px solid ${copied ? '#86efac' : '#bfdbfe'}`,
                                borderRadius: '6px', color: copied ? '#16a34a' : '#0284c7',
                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                gap: '6px', fontSize: '13px', fontWeight: '500'
                            }}
                        >
                            {copied ? <><CheckCircle size={14} /> Copié!</> : <><Copy size={14} /> Copier</>}
                        </button>
                    </div>
                )}
            </div>

            {/* Footer : changer statut */}
            <div className="mobile-card-footer">
                <select
                    value={booking.status}
                    onChange={(e) => onStatusChange(booking._id, e.target.value)}
                    className="mobile-card-select"
                >
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmée</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                    <option value="rejected">Refusée</option>
                </select>
            </div>
        </div>
    );
};

export default BookingCard;
