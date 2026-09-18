import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPaymentHistory, updateBooking } from '../services/adminService';
import { CheckCircle, Eye, X, Phone, Mail, ToggleRight, History, Search } from 'lucide-react';

const PaymentHistoryPage: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewingHostId, setViewingHostId] = useState<string | null>(null);
    const [hostSearch, setHostSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [ribModalImage, setRibModalImage] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: payHistory, isLoading } = useQuery({
        queryKey: ['paymentHistory', selectedMonth, selectedYear],
        queryFn: () => getPaymentHistory({ month: selectedMonth, year: selectedYear })
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ bookingId, eliotelPaid }: { bookingId: string, eliotelPaid: boolean }) =>
            updateBooking(bookingId, { eliotelPaid }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
            queryClient.invalidateQueries({ queryKey: ['billingSummary'] }); // Car ça impacte aussi la facturation en attente
        },
        onError: (error: any) => {
            alert(`Erreur: ${error.response?.data?.message || error.message}`);
        }
    });

    const viewingDetails = payHistory?.find((item: any) => item.host._id === viewingHostId);

    const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const filteredData = payHistory?.filter((item: any) => {
        const searchLower = hostSearch.toLowerCase();
        const fullName = `${item.host.firstName} ${item.host.lastName}`.toLowerCase();
        return (
            item.host.firstName.toLowerCase().includes(searchLower) ||
            item.host.lastName.toLowerCase().includes(searchLower) ||
            item.host.email.toLowerCase().includes(searchLower) ||
            fullName.includes(searchLower)
        );
    }) || [];

    if (isLoading) return <div style={{ padding: '24px' }}>Chargement historique...</div>;

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Historique des Paiements</h1>
                <p style={{ color: 'var(--light)', marginTop: '4px' }}>Consultez les virements déjà effectués aux hôtes.</p>
            </div>

            <div className="card" style={{ marginBottom: '32px', padding: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="input-label">Mois</label>
                        <select
                            className="input-field"
                            style={{ marginBottom: 0 }}
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                            {months.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="input-label">Année</label>
                        <select
                            className="input-field"
                            style={{ marginBottom: 0 }}
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{ height: '42px', padding: '0 24px' }}
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['paymentHistory'] })}
                    >
                        Actualiser
                    </button>
                </div>

                <div style={{ marginTop: '16px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--light)' }} />
                    <input
                        type="text"
                        placeholder="Rechercher un hôte par nom, prénom ou email..."
                        className="input-field"
                        style={{ margin: 0, paddingLeft: '40px' }}
                        value={hostSearch}
                        onFocus={() => setShowSuggestions(true)}
                        onChange={(e) => {
                            setHostSearch(e.target.value);
                            setShowSuggestions(true);
                        }}
                    />

                    {hostSearch && showSuggestions && payHistory && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            marginTop: '4px',
                            zIndex: 100,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            {payHistory
                                .filter((item: any) => {
                                    const searchLower = hostSearch.toLowerCase();
                                    const fullName = `${item.host.firstName} ${item.host.lastName}`.toLowerCase();
                                    return fullName.includes(searchLower) || item.host.email.toLowerCase().includes(searchLower);
                                })
                                .map((item: any) => (
                                    <div
                                        key={item.host._id}
                                        onClick={() => {
                                            setHostSearch(`${item.host.firstName} ${item.host.lastName}`);
                                            setShowSuggestions(false);
                                        }}
                                        style={{
                                            padding: '10px 16px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--bg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <img
                                            src={item.host.avatar || `https://ui-avatars.com/api/?name=${item.host.firstName}+${item.host.lastName}`}
                                            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                                        />
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.host.firstName} {item.host.lastName}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--light)' }}>{item.host.email}</div>
                                        </div>
                                    </div>
                                ))}
                            {payHistory.filter((item: any) => {
                                const searchLower = hostSearch.toLowerCase();
                                const fullName = `${item.host.firstName} ${item.host.lastName}`.toLowerCase();
                                return fullName.includes(searchLower) || item.host.email.toLowerCase().includes(searchLower);
                            }).length === 0 && (
                                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--light)', fontSize: '14px' }}>
                                        Aucun exemple trouvé
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                {filteredData.length > 0 ? (
                    filteredData.map((item: any) => (
                        <div key={item.host._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', borderLeft: '4px solid var(--success)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <img
                                        src={item.host.avatar || `https://ui-avatars.com/api/?name=${item.host.firstName}+${item.host.lastName}&background=10b981&color=fff`}
                                        alt="Host"
                                        style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--success)' }}
                                    />
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px' }}>{item.host.firstName} {item.host.lastName}</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                                            <p style={{ margin: 0, color: 'var(--light)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Mail size={12} /> {item.host.email}
                                            </p>
                                            {item.host.phone && (
                                                <p style={{ margin: 0, color: 'var(--light)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Phone size={12} /> {item.host.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)' }}>
                                        {item.totalAmount.toLocaleString()} €
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                        <span style={{ color: 'var(--light)', fontSize: '14px' }}>
                                            {item.bookingsCount} paiement(s) validé(s)
                                        </span>
                                        <button
                                            onClick={() => setViewingHostId(item.host._id)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--surface)', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', color: 'var(--primary)', fontSize: '12px', fontWeight: '600' }}
                                        >
                                            <Eye size={12} /> Détails
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Paiement viré sur le RIB : <span style={{ fontFamily: 'monospace' }}>{item.host.rib || 'N/A'}</span></span>
                                </div>
                                {item.host.ribImage && (
                                    <button
                                        onClick={() => setRibModalImage(item.host.ribImage)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                                    >
                                        <Eye size={16} /> RIB
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--light)' }}>
                        <History size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3>Aucun historique pour cette période</h3>
                        <p>Les paiements validés apparaîtront ici une fois marqués comme payés.</p>
                    </div>
                )}
            </div>

            {/* Modal d'image RIB */}
            {ribModalImage && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}
                    onClick={() => setRibModalImage(null)}
                >
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setRibModalImage(null)}
                            style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={ribModalImage}
                            alt="RIB"
                            style={{ width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                        />
                    </div>
                </div>
            )}

            {/* Modal de Détails */}
            {viewingDetails && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 10 }}>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>Historique - {viewingDetails.host.firstName}</h2>
                            <button onClick={() => setViewingHostId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--light)' }}><X size={24} /></button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Annonce / Voyageur</th>
                                            <th>Dates</th>
                                            <th>Montant</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingDetails.bookings.map((b: any) => (
                                            <tr key={b._id}>
                                                <td>
                                                    <div style={{ fontWeight: '600' }}>{b.listing.title}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--light)' }}>
                                                        {b.guest.firstName} {b.guest.lastName}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '12px' }}>
                                                        {new Date(b.checkIn).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: '700', color: 'var(--success)' }}>{b.total} €</td>
                                                <td>
                                                    <button
                                                        onClick={() => updateStatusMutation.mutate({ bookingId: b._id, eliotelPaid: false })}
                                                        title="Annuler le statut payé"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)' }}
                                                    >
                                                        <ToggleRight size={32} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn" onClick={() => setViewingHostId(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentHistoryPage;
