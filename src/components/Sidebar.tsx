import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Home,
    CalendarDays,
    LogOut,
    ShieldAlert,
    Star,
    Banknote,
    History,
    Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { logout, user } = useAuth();

    const navItems = [
        { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/admin/listings', icon: <Home size={20} />, label: 'Annonces' },
        { to: '/admin/bookings', icon: <CalendarDays size={20} />, label: 'Réservations' },
        { to: '/admin/billing', icon: <Banknote size={20} />, label: 'Facturation' },
        { to: '/admin/billing/history', icon: <History size={20} />, label: 'Historique' },
        { to: '/admin/users', icon: <Users size={20} />, label: 'Utilisateurs' },
        { to: '/admin/reviews', icon: <Star size={20} />, label: 'Avis' },
        { to: '/admin/reports', icon: <ShieldAlert size={20} />, label: 'Signalements' },
        { to: '/admin/notifications', icon: <Bell size={20} />, label: 'Envoi notification' },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* Header avec logo et bouton fermeture */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <img
                        src="/splash.png"
                        alt="Eliotel Logo"
                        className="sidebar-logo-img"
                    />
                    <h1 className="sidebar-logo-text">Eliotel</h1>
                </div>
                <button 
                    className="sidebar-close-btn" 
                    onClick={onClose}
                    aria-label="Fermer le menu"
                >
                    ×
                </button>
            </div>

            {/* Navigation scrollable */}
            <nav className="sidebar-nav">
                <ul className="sidebar-nav-list">
                    {navItems.map((item) => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                end={item.to === '/admin/billing' || item.to === '/admin'}
                                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                            >
                                <span className="sidebar-nav-icon">{item.icon}</span>
                                <span className="sidebar-nav-label">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Section profil et déconnexion (fixe en bas) */}
            <div className="sidebar-footer">
                <div className="sidebar-profile">
                    <img
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}`}
                        alt="Profile"
                        className="sidebar-profile-avatar"
                    />
                    <div className="sidebar-profile-info">
                        <p className="sidebar-profile-name">{user?.fullName}</p>
                        <p className="sidebar-profile-role">Administrateur</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="sidebar-logout-btn"
                >
                    <LogOut size={20} />
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
