import React, { useState } from 'react';
import { Edit2, Check, X, Phone, Trash2, Copy, CheckCircle } from 'lucide-react';
import type { Booking } from '../../types';

interface BookingTableProps {
    bookings: Booking[];
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

const BookingTable: React.FC<BookingTableProps> = ({
    bookings,
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
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopyPaymentLink = async (bookingId: string, paymentLink: string) => {
        try {
            await navigator.clipboard.writeText(paymentLink);
            setCopiedId(bookingId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            alert('Erreur lors de la copie du lien');
        }
    };

    return (
        <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Annonce</th>
                            <th>Voyageur</th>
                            <th>Hôte</th>
                            <th>Dates</th>
                            <th>Total</th>
                            <th>Statut</th>
                            <th>Paiement</th>
                            <th>Lien de paiement</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => {
                            return (
                                <tr key={booking._id}>
                                    {/* Annonce */}
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img
                                                src={typeof booking.listing === 'object' ? (booking.listing.images.find((img: any) => img.isPrimary)?.url || booking.listing.images[0]?.url) : ''}
                                                alt=""
                                                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                                            />
                                            <p style={{ fontWeight: '600', fontSize: '14px' }}>
                                                {typeof booking.listing === 'object' ? booking.listing.title : 'ID: ' + booking.listing}
                                            </p>
                                        </div>
                                    </td>
                                    {/* Voyageur */}
                                    <td>
                                        <p style={{ fontWeight: '600', fontSize: '14px' }}>
                                            {typeof booking.guest === 'object' ? `${booking.guest.firstName} ${booking.guest.lastName}` : 'ID: ' + booking.guest}
                                        </p>
                                        {typeof booking.guest === 'object' && (
                                            <div style={{ fontSize: '12px', color: 'var(--light)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <p>{booking.guest.email}</p>
                                                {booking.guest.phone && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Phone size={10} /><span>{booking.guest.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    {/* Hôte */}
                                    <td>
                                        <p style={{ fontWeight: '600', fontSize: '14px' }}>
                                            {typeof booking.host === 'object' ? `${booking.host.firstName} ${booking.host.lastName}` : 'ID: ' + booking.host}
                                        </p>
                                        {typeof booking.host === 'object' && (
                                            <div style={{ fontSize: '12px', color: 'var(--light)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <p>{booking.host.email}</p>
                                                {booking.host.phone && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Phone size={10} /><span>{booking.host.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    {/* Dates */}
                                    <td>
                                        {editingDates === booking._id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <input type="date" className="input-field"
                                                    style={{ padding: '4px', fontSize: '12px', marginBottom: 0 }}
                                                    value={editCheckIn} onChange={(e) => setEditCheckIn(e.target.value)} />
                                                <input type="date" className="input-field"
                                                    style={{ padding: '4px', fontSize: '12px', marginBottom: 0 }}
                                                    value={editCheckOut} onChange={(e) => setEditCheckOut(e.target.value)} />
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => onSaveDates(booking._id)} style={{ color: 'var(--success)', border: 'none', background: 'none', cursor: 'pointer' }}><Check size={16} /></button>
                                                    <button onClick={onCancelEdit} style={{ color: 'var(--error)', border: 'none', background: 'none', cursor: 'pointer' }}><X size={16} /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ position: 'relative', paddingRight: '24px' }}>
                                                <div style={{ fontSize: '13px' }}>
                                                    <p style={{ fontWeight: '500' }}>{new Date(booking.checkIn).toLocaleDateString()}</p>
                                                    <p style={{ color: 'var(--light)' }}>au {new Date(booking.checkOut).toLocaleDateString()}</p>
                                                </div>
                                                <button onClick={() => onStartEditDates(booking)}
                                                    style={{ position: 'absolute', right: 0, top: 0, border: 'none', background: 'none', color: 'var(--light)', cursor: 'pointer' }}>
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    {/* Total */}
                                    <td>
                                        {editingPrice === booking._id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <input type="number" className="input-field" min="0" step="0.01"
                                                    style={{ padding: '4px', fontSize: '12px', marginBottom: 0, width: '90px' }}
                                                    value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => onSavePrice(booking._id)} style={{ color: 'var(--success)', border: 'none', background: 'none', cursor: 'pointer' }}><Check size={16} /></button>
                                                    <button onClick={onCancelEditPrice} style={{ color: 'var(--error)', border: 'none', background: 'none', cursor: 'pointer' }}><X size={16} /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ position: 'relative', paddingRight: '24px' }}>
                                                <p style={{ fontWeight: '700' }}>{booking.pricing.total} {booking.pricing.currency}</p>
                                                <button onClick={() => onStartEditPrice(booking)}
                                                    style={{ position: 'absolute', right: 0, top: 0, border: 'none', background: 'none', color: 'var(--light)', cursor: 'pointer' }}>
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    {/* Statut réservation */}
                                    <td>
                                        <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                            {translateStatus(booking.status)}
                                        </span>
                                    </td>
                                    {/* Paiement */}
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                            <span style={{
                                                fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600',
                                                background: (!booking.paymentMethod || booking.paymentMethod === 'cash') ? '#fef9c3' : '#eff6ff',
                                                color: (!booking.paymentMethod || booking.paymentMethod === 'cash') ? '#854d0e' : '#1d4ed8',
                                                border: `1px solid ${(!booking.paymentMethod || booking.paymentMethod === 'cash') ? '#fde047' : '#bfdbfe'}`
                                            }}>
                                                {booking.paymentMethod === 'stripe' ? '💳 Carte' : booking.paymentMethod === 'konnect' ? '💳 Konnect' : '💵 Espèce'}
                                            </span>
                                        </div>
                                        <select
                                            value={booking.paymentStatus}
                                            onChange={(e) => onPaymentStatusChange(booking._id, e.target.value)}
                                            className="input-field"
                                            style={{ padding: '4px 8px', fontSize: '12px', marginBottom: 0, width: 'auto' }}
                                        >
                                            <option value="pending">En attente</option>
                                            <option value="paid">Payé</option>
                                            <option value="refunded">Remboursé</option>
                                            <option value="failed">Échoué</option>
                                        </select>
                                    </td>
                                    {/* Lien de paiement */}
                                    <td>
                                        {booking.paymentLink ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <button
                                                    onClick={() => handleCopyPaymentLink(booking._id, booking.paymentLink!)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: copiedId === booking._id ? '#dcfce7' : '#f0f9ff',
                                                        border: `1px solid ${copiedId === booking._id ? '#86efac' : '#bfdbfe'}`,
                                                        borderRadius: '6px',
                                                        color: copiedId === booking._id ? '#16a34a' : '#0284c7',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                        fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap'
                                                    }}
                                                    title={booking.paymentLink}
                                                >
                                                    {copiedId === booking._id ? <><CheckCircle size={14} />Copié!</> : <><Copy size={14} />Copier</>}
                                                </button>
                                                <span style={{ fontSize: '11px', color: 'var(--light)', fontStyle: 'italic' }}>Pour le client</span>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '13px', color: 'var(--light)' }}>Aucun lien</span>
                                        )}
                                    </td>
                                    {/* Actions */}
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <select
                                                value={booking.status}
                                                onChange={(e) => onStatusChange(booking._id, e.target.value)}
                                                className="input-field"
                                                style={{ padding: '6px 10px', fontSize: '13px', width: '120px', marginBottom: 0, backgroundColor: 'var(--surface)' }}
                                            >
                                                <option value="pending">En attente</option>
                                                <option value="confirmed">Confirmée</option>
                                                <option value="completed">Terminée</option>
                                                <option value="cancelled">Annulée</option>
                                                <option value="rejected">Refusée</option>
                                            </select>
                                            <button
                                                onClick={() => onDelete(booking._id)}
                                                style={{
                                                    padding: '8px', background: '#fef2f2', border: '1px solid #fecaca',
                                                    borderRadius: '6px', color: '#dc2626', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                title="Supprimer la réservation"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BookingTable;
