import api from './api';

export const checkAdminExists = async () => {
    const response = await api.get('/admin/exists');
    return response.data.exists;
};

export const loginAdmin = async (data: any) => {
    const response = await api.post('/admin/login', data);
    return response.data;
};

export const registerAdmin = async (data: any) => {
    const response = await api.post('/admin/register-first', data);
    return response.data;
};

export const getActiveHosts = async () => {
    const response = await api.get('/admin/active-hosts');
    return response.data.data;
};

export const getActiveGuests = async () => {
    const response = await api.get('/admin/active-guests');
    return response.data.data;
};

export const getDashboardStats = async () => {
    const response = await api.get('/admin/stats');
    return response.data.data;
};

export const getAllUsers = async (params?: any) => {
    const response = await api.get('/admin/users', { params });
    return response.data.data;
};

export const getAllListings = async (params?: any) => {
    const response = await api.get('/admin/listings', { params });
    return response.data.data;
};

export const updateUserStatus = async (userId: string, status: string) => {
    const response = await api.patch(`/admin/users/${userId}/status`, { status });
    return response.data.data;
};

export const updateListingStatus = async (listingId: string, status: string) => {
    const response = await api.patch(`/admin/listings/${listingId}/status`, { status });
    return response.data.data;
};

export const updateListing = async (listingId: string, data: any) => {
    const response = await api.patch(`/admin/listings/${listingId}`, data);
    return response.data.data;
};

export const getAllBookings = async (params?: any) => {
    const response = await api.get('/admin/bookings', { params });
    return response.data.data;
};

export const updateBooking = async (bookingId: string, data: any) => {
    console.log('📤 updateBooking appelé:', { bookingId, data });
    const response = await api.patch(`/admin/bookings/${bookingId}`, data);
    console.log('📥 updateBooking réponse:', response.data);
    return response.data.data;
};

export const updateBookingPaymentStatus = async (bookingId: string, paymentStatus: string) => {
    const response = await api.patch(`/admin/bookings/${bookingId}/payment-status`, { paymentStatus });
    return response.data.data;
};

export const getBillingSummary = async (params?: any) => {
    const response = await api.get('/admin/billing/summary', { params });
    return response.data.data;
};

export const getPaymentHistory = async (params?: any) => {
    const response = await api.get('/admin/billing/history', { params });
    return response.data.data;
};

export const markBookingsAsPaid = async (bookingIds: string[]) => {
    const response = await api.post('/admin/billing/pay', { bookingIds });
    return response.data;
};

export const getAllReviews = async (params?: any) => {
    const response = await api.get('/admin/reviews', { params });
    return response.data.data;
};

export const deleteReview = async (reviewId: string) => {
    const response = await api.delete(`/admin/reviews/${reviewId}`);
    return response.data;
};

export const getAllReports = async (params?: any) => {
    const response = await api.get('/admin/reports', { params });
    return response.data.data;
};

export const updateReportStatus = async (reportId: string, status: string) => {
    const response = await api.patch(`/admin/reports/${reportId}/status`, { status });
    return response.data.data;
};

export const deleteReport = async (reportId: string) => {
    const response = await api.delete(`/admin/reports/${reportId}`);
    return response.data;
};

export const sendBroadcastNotification = async (title: string, body: string, data?: any) => {
    const response = await api.post('/admin/notifications/broadcast', { title, body, data });
    return response.data;
};

export const createUser = async (userData: any) => {
    const response = await api.post('/admin/users', userData);
    return response.data.data;
};

export const createBooking = async (bookingData: any) => {
    const response = await api.post('/admin/bookings', bookingData);
    return response.data.data;
};

export const deleteBooking = async (bookingId: string) => {
    const response = await api.delete(`/admin/bookings/${bookingId}`);
    return response.data;
};

export const getOccupiedDates = async (listingId: string) => {
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    const response = await api.get(`/bookings/occupied-dates/${listingId}`, {
        params: {
            startDate: today.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        }
    });
    return response.data.data;
};
