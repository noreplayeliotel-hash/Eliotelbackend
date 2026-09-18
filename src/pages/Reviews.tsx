import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllReviews, deleteReview } from '../services/adminService';
import { Star, Trash2, Search, ExternalLink } from 'lucide-react';
import ResponsiveDataView from '../components/ResponsiveDataView';

const ReviewsPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['adminReviews', search],
        queryFn: () => getAllReviews({ search })
    });

    const deleteMutation = useMutation({
        mutationFn: (reviewId: string) => deleteReview(reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
        }
    });

    if (isLoading) return <div style={{ padding: '24px' }}>Chargement...</div>;

    const reviews = data?.reviews || [];

    const confirmDelete = (reviewId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.')) {
            deleteMutation.mutate(reviewId);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div style={{ display: 'flex', gap: '2px', color: '#FBBF24' }}>
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={16}
                        fill={i < Math.round(rating) ? '#FBBF24' : 'none'}
                        style={{ opacity: i < Math.round(rating) ? 1 : 0.3 }}
                    />
                ))}
            </div>
        );
    };

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Avis et Commentaires</h1>
                    <p style={{ color: 'var(--light)', marginTop: '4px' }}>Modérez les avis laissés par les voyageurs et les hôtes.</p>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--light)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher dans les commentaires..."
                            className="input-field"
                            style={{ paddingLeft: '40px', marginBottom: 0 }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <ResponsiveDataView
                data={reviews}
                renderCard={(review: any) => (
                    <div className="user-mobile-card">
                        {/* Header avec image de l'annonce et note */}
                        <div className="mobile-card-header">
                            <img
                                src={review.listing?.images?.[0]?.url || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=400'}
                                alt=""
                                className="mobile-card-image"
                            />
                            <div className="mobile-card-title-section">
                                <h3 className="mobile-card-title">{review.listing?.title}</h3>
                                <div style={{ display: 'flex', gap: '2px', color: '#FBBF24', marginTop: '4px' }}>
                                    {renderStars(review.rating)}
                                </div>
                            </div>
                        </div>

                        {/* Body avec les détails */}
                        <div className="mobile-card-body">
                            <div className="mobile-card-row">
                                <span className="mobile-card-label">DE</span>
                                <span className="mobile-card-value">
                                    {review.reviewer?.firstName} {review.reviewer?.lastName}
                                    {review.reviewer?.phone && <span style={{ fontSize: '12px', color: 'var(--light)', marginLeft: '4px' }}>({review.reviewer.phone})</span>}
                                </span>
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">POUR</span>
                                <span className="mobile-card-value">
                                    {review.reviewee?.firstName} {review.reviewee?.lastName}
                                    {review.reviewee?.phone && <span style={{ fontSize: '12px', color: 'var(--light)', marginLeft: '4px' }}>({review.reviewee.phone})</span>}
                                </span>
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">TYPE</span>
                                <span className={`status-badge ${review.reviewerRole === 'host' ? 'status-active' : 'status-pending'}`}>
                                    {review.reviewerRole === 'host' ? 'Avis Hôte' : 'Avis Voyageur'}
                                </span>
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">DATE</span>
                                <span className="mobile-card-value">
                                    {new Date(review.createdAt).toLocaleDateString('fr-FR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric' 
                                    })}
                                </span>
                            </div>

                            <div className="mobile-card-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                <span className="mobile-card-label">COMMENTAIRE</span>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'var(--dark)',
                                    lineHeight: '1.5',
                                    fontStyle: 'italic'
                                }}>
                                    "{review.comment}"
                                </p>
                            </div>

                            {review.response && (
                                <div className="mobile-card-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                    <span className="mobile-card-label">RÉPONSE</span>
                                    <p style={{
                                        fontSize: '12px',
                                        color: 'var(--light)',
                                        lineHeight: '1.4',
                                        borderLeft: '2px solid var(--border)',
                                        paddingLeft: '10px'
                                    }}>
                                        {review.response.comment}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer avec actions */}
                        <div className="mobile-card-footer">
                            <button
                                onClick={() => confirmDelete(review._id)}
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
                            <button
                                className="mobile-card-action-btn"
                                style={{
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--dark)',
                                    borderColor: 'var(--border)'
                                }}
                            >
                                <ExternalLink size={18} />
                                <span>Voir</span>
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
                                        <th>Auteur / Destinataire</th>
                                        <th>Annonce</th>
                                        <th>Note & Avis</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reviews.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--light)' }}>
                                                Aucun avis trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        reviews.map((review: any) => (
                                            <tr key={review._id}>
                                                <td style={{ minWidth: '220px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>De:</span>
                                                            <span style={{ fontWeight: '600' }}>{review.reviewer?.firstName} {review.reviewer?.lastName}</span>
                                                            {review.reviewer?.phone && <span style={{ fontSize: '12px', color: 'var(--light)' }}>({review.reviewer.phone})</span>}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--light)', textTransform: 'uppercase' }}>Pour:</span>
                                                            <span>{review.reviewee?.firstName} {review.reviewee?.lastName}</span>
                                                            {review.reviewee?.phone && <span style={{ fontSize: '12px', color: 'var(--light)' }}>({review.reviewee.phone})</span>}
                                                        </div>
                                                        <span style={{
                                                            fontSize: '10px',
                                                            padding: '2px 6px',
                                                            backgroundColor: review.reviewerRole === 'host' ? '#EEF2FF' : '#F3F4F6',
                                                            color: review.reviewerRole === 'host' ? '#4338CA' : '#374151',
                                                            borderRadius: '4px',
                                                            width: 'fit-content'
                                                        }}>
                                                            {review.reviewerRole === 'host' ? 'Avis Hôte' : 'Avis Voyageur'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                                            <img
                                                                src={review.listing?.images?.[0]?.url || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=400'}
                                                                alt=""
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        </div>
                                                        <span style={{ fontSize: '14px', fontWeight: '500', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {review.listing?.title}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {renderStars(review.rating)}
                                                        <p style={{
                                                            fontSize: '13px',
                                                            color: 'var(--dark)',
                                                            maxWidth: '300px',
                                                            lineHeight: '1.4'
                                                        }}>
                                                            "{review.comment}"
                                                        </p>
                                                        {review.response && (
                                                            <div style={{
                                                                fontSize: '12px',
                                                                color: 'var(--light)',
                                                                borderLeft: '2px solid var(--border)',
                                                                paddingLeft: '10px',
                                                                marginTop: '4px'
                                                            }}>
                                                                <span style={{ fontWeight: '600' }}>Réponse:</span> {review.response.comment}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '13px', color: 'var(--light)' }}>
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => confirmDelete(review._id)}
                                                            className="btn"
                                                            style={{
                                                                padding: '8px',
                                                                backgroundColor: '#FDF2F2',
                                                                color: 'var(--error)',
                                                                borderRadius: '8px'
                                                            }}
                                                            title="Supprimer l'avis"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                        <button
                                                            className="btn"
                                                            style={{
                                                                padding: '8px',
                                                                backgroundColor: 'var(--surface)',
                                                                borderRadius: '8px'
                                                            }}
                                                        >
                                                            <ExternalLink size={18} />
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

export default ReviewsPage;
