import React from 'react';
import {
    Users,
    Home,
    CalendarDays,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getAllReports } from '../services/adminService';

const Dashboard: React.FC = () => {
    const { data: statsData, isLoading } = useQuery({
        queryKey: ['adminStats'],
        queryFn: getDashboardStats
    });

    const { data: reportsData, isLoading: isLoadingReports } = useQuery({
        queryKey: ['adminReportsHome'],
        queryFn: () => getAllReports({ limit: 5 })
    });

    if (isLoading) return <div className="loading-container">Chargement...</div>;

    const stats = [
        { label: 'Utilisateurs', value: statsData?.overview?.totalUsers || 0, icon: <Users />, change: '', isPositive: true },
        { label: 'Annonces', value: statsData?.overview?.totalListings || 0, icon: <Home />, change: '', isPositive: true },
        { label: 'Réservations', value: statsData?.overview?.totalBookings || 0, icon: <CalendarDays />, change: '', isPositive: false },
        { label: 'Revenus', value: `${(statsData?.overview?.totalRevenue || 0).toLocaleString()}€`, icon: <TrendingUp />, change: '', isPositive: true },
    ];

    const recentBookings = statsData?.recentBookings || [];

    const translateStatus = (status: string) => {
        const translations: { [key: string]: string } = {
            'pending': 'En attente',
            'confirmed': 'Confirmée',
            'cancelled': 'Annulée',
            'completed': 'Terminée',
            'rejected': 'Refusée'
        };
        return translations[status] || status;
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <h1 className="dashboard-title">Tableau de bord</h1>
                    <p className="dashboard-subtitle">Bienvenue dans votre espace d'administration.</p>
                </div>
                <button className="btn btn-primary dashboard-export-btn">
                    <span className="desktop-only">Exporter les données</span>
                    <span className="mobile-only">Exporter</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-stats-grid">
                {stats.map((stat, idx) => (
                    <div key={idx} className="dashboard-stat-card card">
                        <div className="dashboard-stat-header">
                            <div className="dashboard-stat-icon">
                                {stat.icon}
                            </div>
                            {stat.change && (
                                <div className={`dashboard-stat-change ${stat.isPositive ? 'positive' : 'negative'}`}>
                                    {stat.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                    {stat.change}
                                </div>
                            )}
                        </div>
                        <div className="dashboard-stat-content">
                            <h3 className="dashboard-stat-label">{stat.label}</h3>
                            <p className="dashboard-stat-value">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-content-grid">
                {/* Recent Bookings */}
                <div className="card dashboard-bookings-card">
                    <h2 className="dashboard-section-title">Réservations récentes</h2>
                    <div className="dashboard-table-wrapper">
                        <div className="table-container">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Client</th>
                                        <th className="hide-mobile">Annonce</th>
                                        <th className="hide-mobile">Dates</th>
                                        <th>Total</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="dashboard-empty-state">
                                                Aucune réservation récente
                                            </td>
                                        </tr>
                                    ) : (
                                        recentBookings.map((booking: any) => (
                                            <tr key={booking._id} className="dashboard-table-row">
                                                <td>
                                                    <div className="dashboard-client-cell">
                                                        <img
                                                            src={booking.guest?.avatar || `https://ui-avatars.com/api/?name=${booking.guest?.firstName}+${booking.guest?.lastName}`}
                                                            alt=""
                                                            className="dashboard-client-avatar"
                                                        />
                                                        <div className="dashboard-client-info">
                                                            <span className="dashboard-client-name">
                                                                {booking.guest?.firstName} {booking.guest?.lastName}
                                                            </span>
                                                            <span className="dashboard-client-listing mobile-only">
                                                                {booking.listing?.title}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hide-mobile">
                                                    <span className="dashboard-listing-title">
                                                        {booking.listing?.title}
                                                    </span>
                                                </td>
                                                <td className="hide-mobile dashboard-dates-cell">
                                                    {new Date(booking.checkIn).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - {new Date(booking.checkOut).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                                </td>
                                                <td className="dashboard-total-cell">{booking.pricing?.total} €</td>
                                                <td>
                                                    <span className={`status-badge ${booking.status === 'confirmed' || booking.status === 'completed' ? 'status-active' : booking.status === 'pending' ? 'status-pending' : 'status-cancelled'}`}>
                                                        {translateStatus(booking.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Recent Reports */}
                <div className="card dashboard-reports-card">
                    <h2 className="dashboard-section-title">Derniers signalements</h2>
                    <div className="dashboard-reports-list">
                        {isLoadingReports ? (
                            <p className="dashboard-loading-text">Chargement des signalements...</p>
                        ) : reportsData?.reports?.length > 0 ? (
                            reportsData.reports.slice(0, 5).map((report: any) => (
                                <div key={report._id} className="dashboard-report-item">
                                    <div className="dashboard-report-header">
                                        <span className="dashboard-report-reason">{report.reason}</span>
                                        <span className="dashboard-report-date">
                                            {new Date(report.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="dashboard-report-description">
                                        Signalé par {report.reporter?.firstName} sur {report.reportedUser ? `l'utilisateur ${report.reportedUser.firstName}` : `l'annonce ${report.reportedListing?.title}`}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="dashboard-empty-text">Aucun signalement récent.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
