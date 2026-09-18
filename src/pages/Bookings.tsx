import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllBookings,
    updateBooking,
    updateBookingPaymentStatus,
    deleteBooking
} from '../services/adminService';
import type { Booking } from '../types';
import { Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import ResponsiveDataView from '../components/ResponsiveDataView';
import BookingFilters from '../components/bookings/BookingFilters';
import BookingCard from '../components/bookings/BookingCard';
import BookingTable from '../components/bookings/BookingTable';
import DeleteBookingModal from '../components/bookings/DeleteBookingModal';

type ToastType = 'success' | 'error';
interface Toast { id: number; message: string; type: ToastType; }

const BookingsPage: React.FC = () => {
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [guestFilter, setGuestFilter] = useState('');
    const [hostFilter, setHostFilter] = useState('');
    const [toasts, setToasts] = useState<Toast[]>([]);

    const [editingDates, setEditingDates] = useState<string | null>(null);
    const [editCheckIn, setEditCheckIn] = useState('');
    const [editCheckOut, setEditCheckOut] = useState('');

    const [editingPrice, setEditingPrice] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const showToast = (message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const { data: bookingsData, isLoading } = useQuery({
        queryKey: ['adminBookings', statusFilter, startDate, endDate, guestFilter, hostFilter],
        queryFn: () => getAllBookings({
            status: statusFilter,
            startDate,
            endDate,
            guest: guestFilter,
            host: hostFilter
        })
    });

    // ✅ Mutation générale (dates, status, prix)
    const mutation = useMutation({
        mutationFn: ({ bookingId, data }: { bookingId: string; data: any }) =>
            updateBooking(bookingId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
            const data = variables.data;
            if (data.checkIn || data.checkOut) {
                setEditingDates(null);
                showToast('Dates mises à jour avec succès');
            } else if ('pricingTotal' in data) {
                setEditingPrice(null);
                showToast('Prix mis à jour avec succès');
            } else if ('status' in data) {
                showToast('Statut mis à jour avec succès');
            }
        },
        onError: (error: any) => {
            showToast(error.response?.data?.message || error.message, 'error');
        }
    });

    // ✅ Mutation dédiée pour paymentStatus → route /payment-status
    const paymentStatusMutation = useMutation({
        mutationFn: ({ bookingId, paymentStatus }: { bookingId: string; paymentStatus: string }) =>
            updateBookingPaymentStatus(bookingId, paymentStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
            showToast('Statut de paiement mis à jour avec succès');
        },
        onError: (error: any) => {
            showToast(error.response?.data?.message || error.message, 'error');
        }
    });

    const deleteBookingMutation = useMutation({
        mutationFn: deleteBooking,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
            setShowDeleteModal(false);
            setBookingToDelete(null);
            showToast('Réservation supprimée avec succès');
        },
        onError: (error: any) => {
            showToast(error.response?.data?.message || error.message, 'error');
        }
    });

    const translateStatus = (status: string) => {
        const translations: { [key: string]: string } = {
            pending: 'En attente',
            confirmed: 'Confirmée',
            cancelled: 'Annulée',
            completed: 'Terminée',
            rejected: 'Refusée'
        };
        return translations[status] || status;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
            case 'completed':
                return 'status-active';
            case 'cancelled':
            case 'rejected':
                return 'status-cancelled';
            default:
                return 'status-pending';
        }
    };

    const handleStartEditDates = (booking: Booking) => {
        setEditingDates(booking._id);
        setEditCheckIn(new Date(booking.checkIn).toISOString().split('T')[0]);
        setEditCheckOut(new Date(booking.checkOut).toISOString().split('T')[0]);
    };

    const handleSaveDates = (bookingId: string) => {
        mutation.mutate({ bookingId, data: { checkIn: editCheckIn, checkOut: editCheckOut } });
    };

    const handleStatusChange = (bookingId: string, status: string) => {
        mutation.mutate({ bookingId, data: { status } });
    };

    // ✅ Utilise maintenant la bonne mutation avec la bonne route
    const handlePaymentStatusChange = (bookingId: string, paymentStatus: string) => {
        paymentStatusMutation.mutate({ bookingId, paymentStatus });
    };

    const handleStartEditPrice = (booking: Booking) => {
        setEditingPrice(booking._id);
        setEditPrice(String(booking.pricing.total));
    };

    const handleSavePrice = (bookingId: string) => {
        mutation.mutate({ bookingId, data: { pricingTotal: parseFloat(editPrice) } });
    };

    const handleDeleteClick = (bookingId: string) => {
        setBookingToDelete(bookingId);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        if (bookingToDelete) deleteBookingMutation.mutate(bookingToDelete);
    };

    if (isLoading) return <div>Chargement...</div>;

    const bookings: Booking[] = bookingsData?.bookings || [];

    const sharedProps = {
        translateStatus,
        getStatusColor,
        editingDates,
        editCheckIn,
        editCheckOut,
        setEditCheckIn,
        setEditCheckOut,
        onStartEditDates: handleStartEditDates,
        onSaveDates: handleSaveDates,
        onCancelEdit: () => setEditingDates(null),
        onPaymentStatusChange: handlePaymentStatusChange,
        editingPrice,
        editPrice,
        setEditPrice,
        onStartEditPrice: handleStartEditPrice,
        onSavePrice: handleSavePrice,
        onCancelEditPrice: () => setEditingPrice(null),
        onStatusChange: handleStatusChange,
        onDelete: handleDeleteClick,
    };

    return (
        <div>
            {/* Toast notifications */}
            <div style={{
                position: 'fixed', top: '20px', right: '20px',
                zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px 16px', borderRadius: '8px',
                        minWidth: '280px', maxWidth: '400px',
                        background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
                        border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                        color: toast.type === 'error' ? '#dc2626' : '#16a34a',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        animation: 'slideIn 0.2s ease'
                    }}>
                        {toast.type === 'error'
                            ? <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            : <CheckCircle size={18} style={{ flexShrink: 0 }} />
                        }
                        <span style={{ fontSize: '14px', flex: 1 }}>{toast.message}</span>
                        <button
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Réservations</h1>
                        <p style={{ color: 'var(--light)', marginTop: '4px' }}>
                            Gérez les réservations et les séjours sur la plateforme.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/bookings/new')}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} />
                        Nouvelle réservation
                    </button>
                </div>

                <BookingFilters
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    guestFilter={guestFilter}
                    setGuestFilter={setGuestFilter}
                    hostFilter={hostFilter}
                    setHostFilter={setHostFilter}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                />
            </div>

            <ResponsiveDataView
                data={bookings}
                renderCard={(booking: Booking) => (
                    <BookingCard booking={booking} {...sharedProps} />
                )}
                renderTable={() => (
                    <BookingTable bookings={bookings} {...sharedProps} />
                )}
            />

            <DeleteBookingModal
                show={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setBookingToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                bookingId={bookingToDelete || ''}
                isDeleting={deleteBookingMutation.isPending}
            />
        </div>
    );
};

export default BookingsPage;