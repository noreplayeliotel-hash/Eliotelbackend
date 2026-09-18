import React from 'react';
import { Search } from 'lucide-react';

interface BookingFiltersProps {
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    guestFilter: string;
    setGuestFilter: (value: string) => void;
    hostFilter: string;
    setHostFilter: (value: string) => void;
    startDate: string;
    setStartDate: (value: string) => void;
    endDate: string;
    setEndDate: (value: string) => void;
}

const BookingFilters: React.FC<BookingFiltersProps> = ({
    statusFilter,
    setStatusFilter,
    guestFilter,
    setGuestFilter,
    hostFilter,
    setHostFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate
}) => {
    return (
        <div className="filters-grid">
            <div className="card filter-card">
                <label className="input-label">Statut</label>
                <select
                    className="input-field"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmée</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                    <option value="rejected">Refusée</option>
                </select>
            </div>

            <div className="card filter-card">
                <label className="input-label">Voyageur (Nom/Email)</label>
                <div className="filter-input-wrapper">
                    <Search size={18} className="filter-icon" />
                    <input
                        type="text"
                        className="input-field filter-input-with-icon"
                        placeholder="Rechercher voyageur..."
                        value={guestFilter}
                        onChange={(e) => setGuestFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="card filter-card">
                <label className="input-label">Hôte (Nom/Email)</label>
                <div className="filter-input-wrapper">
                    <Search size={18} className="filter-icon" />
                    <input
                        type="text"
                        className="input-field filter-input-with-icon"
                        placeholder="Rechercher hôte..."
                        value={hostFilter}
                        onChange={(e) => setHostFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="card filter-card">
                <label className="input-label">Check-in du</label>
                <input
                    type="date"
                    className="input-field"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>

            <div className="card filter-card">
                <label className="input-label">Check-in au</label>
                <input
                    type="date"
                    className="input-field"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>
        </div>
    );
};

export default BookingFilters;
