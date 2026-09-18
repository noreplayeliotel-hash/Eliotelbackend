import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllReports, updateReportStatus, deleteReport } from '../services/adminService';
import { ShieldAlert, Trash2, Search, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import ResponsiveDataView from '../components/ResponsiveDataView';

const ReportsPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['adminReports', search],
        queryFn: () => getAllReports({ search })
    });

    const statusMutation = useMutation({
        mutationFn: ({ reportId, status }: { reportId: string, status: string }) => updateReportStatus(reportId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminReports'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (reportId: string) => deleteReport(reportId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminReports'] });
        }
    });

    if (isLoading) return <div style={{ padding: '24px' }}>Chargement...</div>;

    const reports = data?.reports || [];

    const handleStatusUpdate = (reportId: string, status: string) => {
        statusMutation.mutate({ reportId, status });
    };

    const confirmDelete = (reportId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
            deleteMutation.mutate(reportId);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '9999px', width: 'fit-content' }}><Clock size={14} /> En attente</span>;
            case 'reviewed':
                return <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', backgroundColor: '#DBEAFE', color: '#1E40AF', borderRadius: '9999px', width: 'fit-content' }}><ShieldAlert size={14} /> Examiné</span>;
            case 'resolved':
                return <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '9999px', width: 'fit-content' }}><CheckCircle size={14} /> Résolu</span>;
            case 'dismissed':
                return <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', backgroundColor: '#F3F4F6', color: '#374151', borderRadius: '9999px', width: 'fit-content' }}><XCircle size={14} /> Rejeté</span>;
            default:
                return null;
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Gestion des Signalements</h1>
                    <p style={{ color: 'var(--light)', marginTop: '4px' }}>Gérez les signalements d'utilisateurs et d'annonces inappropriés.</p>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--light)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher dans les signalements..."
                            className="input-field"
                            style={{ paddingLeft: '40px', marginBottom: 0 }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <ResponsiveDataView
                data={reports}
                renderCard={(report: any) => (
                    <div className="user-mobile-card">
                        {/* Header avec icône et raison */}
                        <div className="mobile-card-header">
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: '#FEF3C7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <ShieldAlert size={24} color="#92400E" />
                            </div>
                            <div className="mobile-card-title-section">
                                <h3 className="mobile-card-title">{report.reason}</h3>
                                <p className="mobile-card-subtitle">{report.details}</p>
                            </div>
                        </div>

                        {/* Body avec les détails */}
                        <div className="mobile-card-body">
                            <div className="mobile-card-row">
                                <span className="mobile-card-label">ÉLÉMENT SIGNALÉ</span>
                                {report.reportedUser ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertCircle size={16} color="var(--error)" />
                                        <div>
                                            <span className="mobile-card-value">{report.reportedUser.firstName} {report.reportedUser.lastName}</span>
                                            {report.reportedUser.phone && <span style={{ fontSize: '11px', color: 'var(--light)', marginLeft: '4px' }}>({report.reportedUser.phone})</span>}
                                        </div>
                                    </div>
                                ) : report.reportedListing ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img
                                            src={report.reportedListing.images?.[0]?.url || 'https://via.placeholder.com/40x30'}
                                            alt=""
                                            style={{ width: '40px', height: '30px', borderRadius: '4px', objectFit: 'cover' }}
                                        />
                                        <div>
                                            <span className="mobile-card-value">{report.reportedListing.title}</span>
                                            <p style={{ fontSize: '11px', color: 'var(--light)', margin: 0 }}>
                                                Hôte: {report.reportedListing.host?.firstName}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="mobile-card-value">Inconnu</span>
                                )}
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">RAPPORTEUR</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <span className="mobile-card-value">{report.reporter?.firstName} {report.reporter?.lastName}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--light)' }}>{report.reporter?.email}</span>
                                    {report.reporter?.phone && <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '500' }}>{report.reporter.phone}</span>}
                                </div>
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">STATUT</span>
                                {getStatusBadge(report.status)}
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">DATE</span>
                                <span className="mobile-card-value">
                                    {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>

                            <div className="mobile-card-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                <span className="mobile-card-label">CHANGER LE STATUT</span>
                                <select
                                    value={report.status}
                                    onChange={(e) => handleStatusUpdate(report._id, e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        fontSize: '14px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value="pending">En attente</option>
                                    <option value="reviewed">Examiné</option>
                                    <option value="resolved">Résolu</option>
                                    <option value="dismissed">Rejeté</option>
                                </select>
                            </div>
                        </div>

                        {/* Footer avec actions */}
                        <div className="mobile-card-footer">
                            <button
                                onClick={() => confirmDelete(report._id)}
                                className="mobile-card-action-btn"
                                style={{
                                    backgroundColor: '#FDF2F2',
                                    color: 'var(--error)',
                                    borderColor: '#FEE2E2'
                                }}
                            >
                                <Trash2 size={18} />
                                <span>Supprimer</span>
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
                                        <th>Signalement</th>
                                        <th>Élément Signalé</th>
                                        <th>Rapporteur</th>
                                        <th>Statut</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--light)' }}>
                                                Aucun signalement trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        reports.map((report: any) => (
                                            <tr key={report._id}>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '300px' }}>
                                                        <span style={{ fontWeight: '600', color: 'var(--dark)' }}>{report.reason}</span>
                                                        <p style={{ fontSize: '13px', color: 'var(--light)', margin: 0 }}>{report.details}</p>
                                                    </div>
                                                </td>
                                                <td>
                                                    {report.reportedUser ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <AlertCircle size={16} color="var(--error)" />
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>{report.reportedUser.firstName} {report.reportedUser.lastName}</p>
                                                                <p style={{ fontSize: '11px', color: 'var(--light)', margin: 0 }}>Utilisateur {report.reportedUser.phone && `(${report.reportedUser.phone})`}</p>
                                                            </div>
                                                        </div>
                                                    ) : report.reportedListing ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '40px', height: '30px', borderRadius: '4px', overflow: 'hidden' }}>
                                                                <img src={report.reportedListing.images?.[0]?.url || 'https://via.placeholder.com/40x30'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{report.reportedListing.title}</p>
                                                                <p style={{ fontSize: '11px', color: 'var(--light)', margin: 0 }}>
                                                                    Hôte: {report.reportedListing.host?.firstName} {report.reportedListing.host?.phone && `(${report.reportedListing.host.phone})`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--light)', fontSize: '13px' }}>Inconnu</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{report.reporter?.firstName} {report.reporter?.lastName}</span>
                                                        <span style={{ fontSize: '11px', color: 'var(--light)' }}>{report.reporter?.email}</span>
                                                        {report.reporter?.phone && <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '500' }}>{report.reporter.phone}</span>}
                                                    </div>
                                                </td>
                                                <td>{getStatusBadge(report.status)}</td>
                                                <td>
                                                    <span style={{ fontSize: '13px', color: 'var(--light)' }}>
                                                        {new Date(report.createdAt).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <select
                                                            value={report.status}
                                                            onChange={(e) => handleStatusUpdate(report._id, e.target.value)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                fontSize: '12px',
                                                                borderRadius: '6px',
                                                                border: '1px solid var(--border)',
                                                                backgroundColor: 'white'
                                                            }}
                                                        >
                                                            <option value="pending">En attente</option>
                                                            <option value="reviewed">Examiné</option>
                                                            <option value="resolved">Résolu</option>
                                                            <option value="dismissed">Rejeté</option>
                                                        </select>
                                                        <button
                                                            onClick={() => confirmDelete(report._id)}
                                                            className="btn"
                                                            style={{
                                                                padding: '6px',
                                                                backgroundColor: '#FDF2F2',
                                                                color: 'var(--error)',
                                                                borderRadius: '6px'
                                                            }}
                                                            title="Supprimer le signalement"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            />
        </div>
    );
};

export default ReportsPage;
