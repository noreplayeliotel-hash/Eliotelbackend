import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllListings, updateListingStatus, getActiveHosts } from '../services/adminService';
import type { Listing, User } from '../types';
import { ExternalLink, Search, User as UserIcon, X, Mail, Phone, Settings } from 'lucide-react';
import ResponsiveDataView from '../components/ResponsiveDataView';
import ListingEditPanel from './ListingEdit';

const ListingsPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [hostSearch, setHostSearch] = useState('');
    const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
    const [showHostSuggestions, setShowHostSuggestions] = useState(false);
    const [selectedListingForImages, setSelectedListingForImages] = useState<Listing | null>(null);
    const [editingListing, setEditingListing] = useState<Listing | null>(null);

    const queryClient = useQueryClient();

    // Fetch listings with host filter
    const { data: listingsData, isLoading } = useQuery({
        queryKey: ['adminListings', search, selectedHostId, statusFilter],
        queryFn: () => getAllListings({ search, host: selectedHostId, status: statusFilter })
    });

    // Translation helper
    const translateStatus = (status: string) => {
        const translations: { [key: string]: string } = {
            'active': 'Actif',
            'suspended': 'Suspendu',
            'draft': 'Brouillon',
            'pending': 'En attente',
            'archived': 'Archivé'
        };
        return translations[status] || status;
    };

    // Fetch only hosts who have listings
    const { data: hosts } = useQuery<User[]>({
        queryKey: ['activeHosts'],
        queryFn: getActiveHosts
    });

    const mutation = useMutation({
        mutationFn: ({ listingId, status }: { listingId: string, status: string }) => {
            console.log(`Mutation triggered for ${listingId} to ${status}`);
            return updateListingStatus(listingId, status);
        },
        onSuccess: (data) => {
            console.log('Update successful:', data);
            queryClient.invalidateQueries({ queryKey: ['adminListings'] });
            alert('Statut mis à jour avec succès');
        },
        onError: (error: any) => {
            console.error('Update failed:', error);
            alert(`Erreur lors de la mise à jour: ${error.response?.data?.message || error.message}`);
        }
    });

    if (isLoading) return <div>Chargement...</div>;

    const listings: Listing[] = listingsData?.listings || [];

    // Filter suggestions based on hostSearch
    const hostSuggestions = (hosts || []).filter(h =>
        (h.firstName + ' ' + h.lastName).toLowerCase().includes(hostSearch.toLowerCase()) ||
        h.email.toLowerCase().includes(hostSearch.toLowerCase())
    );

    const selectedHost = (hosts || []).find(h => h._id === selectedHostId);

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Annonces</h1>
                        <p style={{ color: 'var(--light)', marginTop: '4px' }}>
                            {selectedHost ? `Annonces de ${selectedHost.firstName} ${selectedHost.lastName}` : 'Modérez et gérez les propriétés publiées.'}
                        </p>
                    </div>
                </div>

                <div className="filters-grid">
                    {/* Filtre par Hôte - Version Recherchable */}
                    <div className="card filter-card">
                        <label className="input-label">Hôte (ayant des annonces)</label>
                        <div className="filter-input-wrapper">
                            <UserIcon size={18} className="filter-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher un hôte..."
                                className="input-field filter-input-with-icon"
                                value={selectedHost ? `${selectedHost.firstName} ${selectedHost.lastName}` : hostSearch}
                                onChange={(e) => {
                                    setHostSearch(e.target.value);
                                    if (selectedHostId) setSelectedHostId(null);
                                    setShowHostSuggestions(true);
                                }}
                                onFocus={() => setShowHostSuggestions(true)}
                                readOnly={!!selectedHostId}
                            />
                            {selectedHostId && (
                                <button
                                    onClick={() => {
                                        setSelectedHostId(null);
                                        setHostSearch('');
                                    }}
                                    className="filter-clear-btn"
                                    aria-label="Effacer"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {showHostSuggestions && !selectedHostId && hostSearch.length > 0 && (
                            <div className="suggestions-dropdown card glass">
                                {hostSuggestions.length > 0 ? hostSuggestions.map(h => (
                                    <div
                                        key={h._id}
                                        onClick={() => {
                                            setSelectedHostId(h._id);
                                            setShowHostSuggestions(false);
                                        }}
                                        className="suggestion-item"
                                    >
                                        <img
                                            src={h.avatar || `https://ui-avatars.com/api/?name=${h.firstName}+${h.lastName}`}
                                            className="suggestion-avatar"
                                            alt=""
                                        />
                                        <div className="suggestion-info">
                                            <p className="suggestion-name">{h.firstName} {h.lastName}</p>
                                            <p className="suggestion-email">{h.email}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="suggestions-empty">Aucun hôte trouvé</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="card filter-card">
                        <label className="input-label">Statut</label>
                        <select
                            className="input-field"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Tous les statuts</option>
                            <option value="active">Actif</option>
                            <option value="draft">Brouillon</option>
                            <option value="suspended">Suspendu</option>
                            <option value="pending">En attente</option>
                        </select>
                    </div>

                    <div className="card filter-card">
                        <label className="input-label">Rechercher une annonce</label>
                        <div className="filter-input-wrapper">
                            <Search size={20} className="filter-icon" />
                            <input
                                type="text"
                                placeholder="Titre ou ville..."
                                className="input-field filter-input-with-icon"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ResponsiveDataView
                data={listings}
                renderCard={(listing: Listing) => (
                    <div className="listing-mobile-card">
                        {/* Header */}
                        <div className="mobile-card-header">
                            <img
                                src={listing.images.find(img => img.isPrimary)?.url || listing.images[0]?.url}
                                alt=""
                                className="mobile-card-image"
                                onClick={() => setSelectedListingForImages(listing)}
                            />
                            <div className="mobile-card-title-section">
                                <h3 className="mobile-card-title">{listing.title}</h3>
                                <p className="mobile-card-subtitle">
                                    {typeof listing.host === 'object' ? `${listing.host.firstName} ${listing.host.lastName}` : 'Hôte'}
                                </p>
                            </div>
                        </div>

                        <div className="mobile-card-body">
                            {/* Hôte */}
                            {typeof listing.host === 'object' && (
                                <div className="mobile-card-row" style={{ alignItems: 'flex-start' }}>
                                    <span className="mobile-card-label">HÔTE</span>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: '600', fontSize: '13px', margin: 0 }}>{listing.host.firstName} {listing.host.lastName}</p>
                                        {listing.host.email && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                                                <Mail size={11} color="var(--light)" />
                                                <span style={{ fontSize: '12px', color: 'var(--light)' }}>{listing.host.email}</span>
                                            </div>
                                        )}
                                        {listing.host.phone && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                                                <Phone size={11} color="var(--light)" />
                                                <span style={{ fontSize: '12px', color: 'var(--light)' }}>{listing.host.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">VILLE</span>
                                <span className="mobile-card-value">{listing.address.city}, {listing.address.country}</span>
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">TYPE</span>
                                <span className="mobile-card-value" style={{ textTransform: 'capitalize' }}>
                                    {listing.propertyType.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">PRIX</span>
                                <span className="mobile-card-value mobile-card-value-bold">
                                    {listing.pricing.basePrice} {listing.pricing.currency}/nuit
                                </span>
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">STATUT</span>
                                <span className={`status-badge ${listing.status === 'active' ? 'status-active' : listing.status === 'suspended' ? 'status-cancelled' : 'status-pending'}`}>
                                    {translateStatus(listing.status)}
                                </span>
                            </div>

                            {/* Dates bloquées */}
                            <div className="mobile-card-row" style={{ alignItems: 'flex-start' }}>
                                <span className="mobile-card-label">BLOQUÉES</span>
                                <div style={{ textAlign: 'right' }}>
                                    {((listing as any).externalBlocks || []).length === 0 ? (
                                        <span style={{ fontSize: '12px', color: 'var(--light)' }}>Aucune</span>
                                    ) : (
                                        ((listing as any).externalBlocks || []).slice(0, 2).map((b: any, i: number) => (
                                            <div key={i} style={{ fontSize: '11px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', marginBottom: '2px' }}>
                                                {new Date(b.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} → {new Date(b.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                        ))
                                    )}
                                    {((listing as any).externalBlocks || []).length > 2 && (
                                        <span style={{ fontSize: '11px', color: 'var(--light)' }}>+{((listing as any).externalBlocks || []).length - 2} autres</span>
                                    )}
                                </div>
                            </div>

                            {/* Prix saisonniers */}
                            <div className="mobile-card-row" style={{ alignItems: 'flex-start' }}>
                                <span className="mobile-card-label">SAISONNIERS</span>
                                <div style={{ textAlign: 'right' }}>
                                    {((listing.pricing as any)?.seasonalPricing || []).length === 0 ? (
                                        <span style={{ fontSize: '12px', color: 'var(--light)' }}>Aucun</span>
                                    ) : (
                                        ((listing.pricing as any)?.seasonalPricing || []).slice(0, 2).map((s: any, i: number) => (
                                            <div key={i} style={{ fontSize: '11px', background: '#f0fdf4', color: '#16a34a', padding: '2px 6px', borderRadius: '4px', marginBottom: '2px' }}>
                                                {s.price} {listing.pricing.currency} {s.label ? `· ${s.label}` : ''}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mobile-card-footer">
                            <select
                                value={listing.status}
                                onChange={(e) => mutation.mutate({ listingId: listing._id, status: e.target.value })}
                                className="mobile-card-select"
                                style={{ flex: 1 }}
                            >
                                <option value="active">Actif</option>
                                <option value="suspended">Suspendu</option>
                                <option value="draft">Brouillon</option>
                                <option value="pending">En attente</option>
                            </select>
                            <button
                                className="mobile-card-action-btn secondary"
                                onClick={() => window.open(`http://localhost:3000/listings/${listing._id}`, '_blank')}
                                style={{ width: '44px', padding: '9px' }}
                            >
                                <ExternalLink size={18} />
                            </button>
                            <button
                                className="mobile-card-action-btn secondary"
                                onClick={() => setEditingListing(listing)}
                                style={{ width: '44px', padding: '9px', color: 'var(--primary)' }}
                                title="Gérer disponibilités & prix"
                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>
                )}
                renderTable={() => (
                    <div className="card" style={{ padding: 0 }}>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Hôte</th>
                                        <th>Email</th>
                                        <th>Téléphone</th>
                                        <th>Annonce</th>
                                        <th>Dates bloquées</th>
                                        <th>Prix saisonniers</th>
                                        <th>Type</th>
                                        <th>Prix</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listings.map((listing) => (
                                        <tr key={listing._id}>
                                            <td>
                                                <p style={{ fontSize: '14px', fontWeight: '600' }}>
                                                    {typeof listing.host === 'object' ? `${listing.host.firstName} ${listing.host.lastName}` : 'ID: ' + listing.host}
                                                </p>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                    <Mail size={14} style={{ color: 'var(--light)' }} />
                                                    <span>{typeof listing.host === 'object' ? listing.host.email : '-'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                    <Phone size={14} style={{ color: 'var(--light)' }} />
                                                    <span>{(typeof listing.host === 'object' && listing.host.phone) ? listing.host.phone : '-'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img
                                                        src={listing.images.find(img => img.isPrimary)?.url || listing.images[0]?.url}
                                                        alt=""
                                                        style={{ width: '64px', height: '48px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer' }}
                                                        onClick={() => setSelectedListingForImages(listing)}
                                                    />
                                                    <div>
                                                        <p style={{ fontWeight: '600', fontSize: '14px' }}>{listing.title}</p>
                                                        <p style={{ fontSize: '12px', color: 'var(--light)' }}>{listing.address.city}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {/* Dates bloquées */}
                                                {(() => {
                                                    const blocks = (listing as any).externalBlocks || [];
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {blocks.length === 0 ? (
                                                                <span style={{ fontSize: '12px', color: 'var(--light)' }}>Aucun</span>
                                                            ) : (
                                                                blocks.slice(0, 2).map((b: any, i: number) => (
                                                                    <div key={i} style={{ fontSize: '11px', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                                        {new Date(b.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} → {new Date(b.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                                                    </div>
                                                                ))
                                                            )}
                                                            {blocks.length > 2 && (
                                                                <span style={{ fontSize: '11px', color: 'var(--light)' }}>+{blocks.length - 2} autres</span>
                                                            )}
                                                            <button onClick={() => setEditingListing(listing)} style={{ fontSize: '11px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', textAlign: 'left' }}>
                                                                ✏️ Gérer
                                                            </button>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td>
                                                {/* Prix saisonniers */}
                                                {(() => {
                                                    const seasons = (listing.pricing as any)?.seasonalPricing || [];
                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {seasons.length === 0 ? (
                                                                <span style={{ fontSize: '12px', color: 'var(--light)' }}>Aucun</span>
                                                            ) : (
                                                                seasons.slice(0, 2).map((s: any, i: number) => (
                                                                    <div key={i} style={{ fontSize: '11px', background: '#f0fdf4', color: '#16a34a', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                                        {s.price} {listing.pricing.currency} {s.label ? `· ${s.label}` : ''}
                                                                    </div>
                                                                ))
                                                            )}
                                                            {seasons.length > 2 && (
                                                                <span style={{ fontSize: '11px', color: 'var(--light)' }}>+{seasons.length - 2} autres</span>
                                                            )}
                                                            <button onClick={() => setEditingListing(listing)} style={{ fontSize: '11px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', textAlign: 'left' }}>
                                                                ✏️ Gérer
                                                            </button>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td>
                                                <p style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                                                    {listing.propertyType.replace('_', ' ')}
                                                </p>
                                            </td>
                                            <td>
                                                <p style={{ fontWeight: '600' }}>{listing.pricing.basePrice} {listing.pricing.currency}</p>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${listing.status === 'active' ? 'status-active' :
                                                    listing.status === 'suspended' ? 'status-cancelled' :
                                                        'status-pending'
                                                    }`}>
                                                    {translateStatus(listing.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <select
                                                        value={listing.status}
                                                        onChange={(e) => mutation.mutate({ listingId: listing._id, status: e.target.value })}
                                                        className="input-field"
                                                        style={{
                                                            padding: '6px 10px',
                                                            fontSize: '13px',
                                                            width: '130px',
                                                            marginBottom: 0,
                                                            backgroundColor: 'var(--surface)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value="active">Actif</option>
                                                        <option value="suspended">Suspendu</option>
                                                        <option value="draft">Brouillon</option>
                                                        <option value="pending">En attente</option>
                                                    </select>

                                                    <button
                                                        className="btn"
                                                        style={{ padding: '6px', backgroundColor: 'var(--surface)', borderRadius: '8px' }}
                                                        onClick={() => window.open(`http://localhost:3000/listings/${listing._id}`, '_blank')}
                                                    >
                                                        <ExternalLink size={18} />
                                                    </button>
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '6px', backgroundColor: '#fff5f7', borderRadius: '8px', color: 'var(--primary)' }}
                                                        onClick={() => setEditingListing(listing)}
                                                        title="Gérer disponibilités & prix"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            />

            {editingListing && (
                <ListingEditPanel
                    listing={editingListing}
                    onClose={() => setEditingListing(null)}
                />
            )}

            {selectedListingForImages && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    zIndex: 1000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }} onClick={() => setSelectedListingForImages(null)}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            padding: '16px 24px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Images de l'annonce: {selectedListingForImages.title}</h3>
                            <button onClick={() => setSelectedListingForImages(null)} style={{ background: 'none', cursor: 'pointer', color: 'var(--dark)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{
                            padding: '24px',
                            overflowY: 'auto',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '16px'
                        }}>
                            {selectedListingForImages.images && selectedListingForImages.images.length > 0 ? (
                                selectedListingForImages.images.map((img, index) => (
                                    <div key={img._id || index} style={{ aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
                                        <img
                                            src={img.url}
                                            alt={`Image ${index + 1}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        {img.isPrimary && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '8px',
                                                left: '8px',
                                                backgroundColor: 'var(--primary)',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                fontWeight: 'bold'
                                            }}>
                                                Principale
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--light)' }}>Aucune image disponible pour cette annonce.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListingsPage;
