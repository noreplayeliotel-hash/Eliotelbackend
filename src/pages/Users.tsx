import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, updateUserStatus } from '../services/adminService';
import type { User } from '../types';
import { Shield, ShieldOff, MoreVertical, Search } from 'lucide-react';
import ResponsiveDataView from '../components/ResponsiveDataView';

const UsersPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['adminUsers', search],
        queryFn: () => getAllUsers({ search })
    });

    const mutation = useMutation({
        mutationFn: ({ userId, status }: { userId: string, status: string }) =>
            updateUserStatus(userId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        }
    });

    if (isLoading) return <div>Chargement...</div>;

    const users: User[] = data?.users || [];

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Utilisateurs</h1>
                    <p style={{ color: 'var(--light)', marginTop: '4px' }}>Consultez et gérez l'ensemble des comptes de la plateforme.</p>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--light)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou email..."
                            className="input-field"
                            style={{ paddingLeft: '40px', marginBottom: 0 }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <ResponsiveDataView
                data={users}
                renderCard={(user: User) => (
                    <div className="user-mobile-card">
                        {/* Header avec avatar et nom */}
                        <div className="mobile-card-header">
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}`}
                                alt=""
                                className="mobile-card-image"
                                style={{ borderRadius: '50%' }}
                            />
                            <div className="mobile-card-title-section">
                                <h3 className="mobile-card-title">{user.fullName}</h3>
                                <p className="mobile-card-subtitle">{user.email}</p>
                            </div>
                        </div>

                        {/* Body avec les détails */}
                        <div className="mobile-card-body">
                            <div className="mobile-card-row">
                                <span className="mobile-card-label">TÉLÉPHONE</span>
                                <span className="mobile-card-value">{user.phone || '-'}</span>
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">INSCRIPTION</span>
                                <span className="mobile-card-value">
                                    {new Date(user.createdAt).toLocaleDateString('fr-FR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric' 
                                    })}
                                </span>
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">STATUT</span>
                                <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-cancelled'}`}>
                                    {user.status === 'active' ? 'Actif' : 'Suspendu'}
                                </span>
                            </div>
                        </div>

                        {/* Footer avec actions */}
                        <div className="mobile-card-footer">
                            <button
                                onClick={() => mutation.mutate({
                                    userId: user._id,
                                    status: user.status === 'active' ? 'suspended' : 'active'
                                })}
                                className="mobile-card-action-btn"
                                style={{
                                    backgroundColor: user.status === 'active' ? '#FDF2F2' : '#F0FDF4',
                                    color: user.status === 'active' ? 'var(--error)' : 'var(--success)',
                                    borderColor: user.status === 'active' ? '#FEE2E2' : '#D1FAE5'
                                }}
                            >
                                {user.status === 'active' ? <ShieldOff size={18} /> : <Shield size={18} />}
                                <span>{user.status === 'active' ? 'Suspendre' : 'Activer'}</span>
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
                                        <th>Utilisateur</th>
                                        <th>Téléphone</th>
                                        <th>Statut</th>
                                        <th>Inscription</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img
                                                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}`}
                                                        alt=""
                                                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                    <div>
                                                        <p style={{ fontWeight: '600' }}>{user.fullName}</p>
                                                        <p style={{ fontSize: '12px', color: 'var(--light)' }}>{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <p style={{ fontSize: '14px' }}>{user.phone || '-'}</p>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-cancelled'}`}>
                                                    {user.status === 'active' ? 'Actif' : 'Suspendu'}
                                                </span>
                                            </td>
                                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => mutation.mutate({
                                                            userId: user._id,
                                                            status: user.status === 'active' ? 'suspended' : 'active'
                                                        })}
                                                        className="btn"
                                                        style={{
                                                            padding: '6px',
                                                            backgroundColor: user.status === 'active' ? '#FDF2F2' : '#F0FDF4',
                                                            color: user.status === 'active' ? 'var(--error)' : 'var(--success)',
                                                            borderRadius: '8px'
                                                        }}
                                                        title={user.status === 'active' ? 'Suspendre' : 'Activer'}
                                                    >
                                                        {user.status === 'active' ? <ShieldOff size={18} /> : <Shield size={18} />}
                                                    </button>
                                                    <button className="btn" style={{ padding: '6px', backgroundColor: 'var(--surface)', borderRadius: '8px' }}>
                                                        <MoreVertical size={18} />
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
        </div>
    );
};

export default UsersPage;
