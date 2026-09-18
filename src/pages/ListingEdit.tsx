import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateListing } from '../services/adminService';
import type { Listing } from '../types';
import { Plus, Trash2, X, CheckCircle, AlertCircle, Calendar, TrendingUp } from 'lucide-react';

type ToastType = 'success' | 'error';
interface Toast { id: number; message: string; type: ToastType; }

interface ExternalBlock {
    _id?: string;
    startDate: string;
    endDate: string;
    reason: string;
}

interface SeasonalPrice {
    _id?: string;
    startDate: string;
    endDate: string;
    price: number;
    label: string;
}

interface ListingEditPanelProps {
    listing: Listing;
    onClose: () => void;
}

const ListingEditPanel: React.FC<ListingEditPanelProps> = ({ listing, onClose }) => {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<'blocks' | 'seasonal'>('blocks');
    const [toasts, setToasts] = useState<Toast[]>([]);

    // External blocks state
    const [blocks, setBlocks] = useState<ExternalBlock[]>(
        ((listing as any).externalBlocks || []).map((b: any) => ({
            _id: b._id,
            startDate: new Date(b.startDate).toISOString().split('T')[0],
            endDate: new Date(b.endDate).toISOString().split('T')[0],
            reason: b.reason || 'Indisponible'
        }))
    );
    const [newBlock, setNewBlock] = useState<ExternalBlock>({ startDate: '', endDate: '', reason: 'Indisponible' });

    // Seasonal pricing state
    const [seasonal, setSeasonal] = useState<SeasonalPrice[]>(
        ((listing.pricing as any)?.seasonalPricing || []).map((s: any) => ({
            _id: s._id,
            startDate: new Date(s.startDate).toISOString().split('T')[0],
            endDate: new Date(s.endDate).toISOString().split('T')[0],
            price: s.price,
            label: s.label || ''
        }))
    );
    const [newSeasonal, setNewSeasonal] = useState<SeasonalPrice>({ startDate: '', endDate: '', price: 0, label: '' });

    const showToast = (message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const mutation = useMutation({
        mutationFn: (data: any) => updateListing(listing._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminListings'] });
            showToast('Sauvegardé avec succès');
        },
        onError: (e: any) => showToast(e.response?.data?.message || e.message, 'error')
    });

    const saveBlocks = () => mutation.mutate({ externalBlocks: blocks });
    const saveSeasonal = () => mutation.mutate({ seasonalPricing: seasonal });

    const addBlock = () => {
        if (!newBlock.startDate || !newBlock.endDate) return;
        if (new Date(newBlock.endDate) <= new Date(newBlock.startDate)) {
            showToast('La date de fin doit être après la date de début', 'error');
            return;
        }
        setBlocks(prev => [...prev, { ...newBlock }]);
        setNewBlock({ startDate: '', endDate: '', reason: 'Indisponible' });
    };

    const addSeasonal = () => {
        if (!newSeasonal.startDate || !newSeasonal.endDate || !newSeasonal.price) return;
        if (new Date(newSeasonal.endDate) <= new Date(newSeasonal.startDate)) {
            showToast('La date de fin doit être après la date de début', 'error');
            return;
        }
        setSeasonal(prev => [...prev, { ...newSeasonal }]);
        setNewSeasonal({ startDate: '', endDate: '', price: 0, label: '' });
    };

    const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

    return ReactDOM.createPortal(
        <>
            {/* Toasts */}
            {toasts.length > 0 && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'all' }}>
                        {toasts.map(t => (
                            <div key={t.id} style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px',
                                borderRadius: '10px', minWidth: '320px', background: 'white',
                                borderLeft: `4px solid ${t.type === 'error' ? '#dc2626' : '#16a34a'}`,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                            }}>
                                {t.type === 'error' ? <AlertCircle size={20} color="#dc2626" /> : <CheckCircle size={20} color="#16a34a" />}
                                <span style={{ fontSize: '14px', flex: 1 }}>{t.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Overlay */}
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000 }} onClick={onClose} />

            {/* Panel — bottom sheet sur mobile */}
            <div className="listing-edit-panel" style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                zIndex: 9001, background: 'white',
                borderRadius: '20px 20px 0 0',
                height: '82vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.25)'
            }}>
                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</h2>
                        <p style={{ fontSize: '12px', color: 'var(--light)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {listing.address.city}, {listing.address.country} · {listing.pricing.basePrice} {listing.pricing.currency}/nuit
                        </p>
                    </div>
                    <div onClick={onClose} style={{ cursor: 'pointer', color: 'var(--light)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        <X size={22} />
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid var(--border)', padding: '0 16px', overflowX: 'auto' }}>
                    {[
                        { key: 'blocks', label: 'Dates bloquées', icon: <Calendar size={16} /> },
                        { key: 'seasonal', label: 'Prix saisonniers', icon: <TrendingUp size={16} /> }
                    ].map(t => (
                        <div key={t.key} onClick={() => setTab(t.key as any)} style={{
                            padding: '12px 16px', cursor: 'pointer',
                            fontSize: '13px', fontWeight: tab === t.key ? '600' : '400',
                            color: tab === t.key ? 'var(--primary)' : 'var(--light)',
                            borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
                            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px',
                            marginBottom: '-1px', whiteSpace: 'nowrap', flexShrink: 0, userSelect: 'none'
                        }}>
                            {t.icon} {t.label}
                            <span style={{ background: tab === t.key ? 'var(--primary)' : '#e5e7eb', color: tab === t.key ? 'white' : 'var(--light)', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: '600' }}>
                                {t.key === 'blocks' ? blocks.length : seasonal.length}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

                    {/* ── EXTERNAL BLOCKS ── */}
                    {tab === 'blocks' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Add form */}
                            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px', border: '1px solid var(--border)' }}>
                                <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px' }}>Ajouter un blocage</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Début</label>
                                        <input type="date" className="input-field" value={newBlock.startDate}
                                            onChange={e => setNewBlock(p => ({ ...p, startDate: e.target.value }))}
                                            style={{ marginBottom: 0 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Fin</label>
                                        <input type="date" className="input-field" value={newBlock.endDate}
                                            min={newBlock.startDate}
                                            onChange={e => setNewBlock(p => ({ ...p, endDate: e.target.value }))}
                                            style={{ marginBottom: 0 }} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Raison</label>
                                    <input type="text" className="input-field" value={newBlock.reason}
                                        onChange={e => setNewBlock(p => ({ ...p, reason: e.target.value }))}
                                        placeholder="Ex: Maintenance, Usage personnel..."
                                        style={{ marginBottom: 0 }} />
                                </div>
                                <button onClick={addBlock} disabled={!newBlock.startDate || !newBlock.endDate}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', opacity: (!newBlock.startDate || !newBlock.endDate) ? 0.5 : 1 }}>
                                    <Plus size={16} /> Ajouter
                                </button>
                            </div>

                            {/* List */}
                            {blocks.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--light)', padding: '24px', fontSize: '14px' }}>Aucun blocage configuré</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {blocks.map((b, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                                            <Calendar size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: '600', fontSize: '14px', margin: 0 }}>{fmt(b.startDate)} → {fmt(b.endDate)}</p>
                                                <p style={{ fontSize: '12px', color: 'var(--light)', margin: '2px 0 0' }}>{b.reason}</p>
                                            </div>
                                            <button onClick={() => setBlocks(prev => prev.filter((_, j) => j !== i))}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── SEASONAL PRICING ── */}
                    {tab === 'seasonal' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p style={{ fontSize: '13px', color: 'var(--light)', margin: 0 }}>
                                Prix de base : <strong style={{ color: 'var(--dark)' }}>{listing.pricing.basePrice} {listing.pricing.currency}/nuit</strong>
                            </p>

                            {/* Add form */}
                            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px', border: '1px solid var(--border)' }}>
                                <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px' }}>Ajouter une période</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Début</label>
                                        <input type="date" className="input-field" value={newSeasonal.startDate}
                                            onChange={e => setNewSeasonal(p => ({ ...p, startDate: e.target.value }))}
                                            style={{ marginBottom: 0 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Fin</label>
                                        <input type="date" className="input-field" value={newSeasonal.endDate}
                                            min={newSeasonal.startDate}
                                            onChange={e => setNewSeasonal(p => ({ ...p, endDate: e.target.value }))}
                                            style={{ marginBottom: 0 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Prix/nuit ({listing.pricing.currency})</label>
                                        <input type="number" className="input-field" value={newSeasonal.price || ''}
                                            onChange={e => setNewSeasonal(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                                            min="1" placeholder="Ex: 150"
                                            style={{ marginBottom: 0 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Label (optionnel)</label>
                                        <input type="text" className="input-field" value={newSeasonal.label}
                                            onChange={e => setNewSeasonal(p => ({ ...p, label: e.target.value }))}
                                            placeholder="Ex: Haute saison, Été..."
                                            style={{ marginBottom: 0 }} />
                                    </div>
                                </div>
                                <button onClick={addSeasonal} disabled={!newSeasonal.startDate || !newSeasonal.endDate || !newSeasonal.price}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', opacity: (!newSeasonal.startDate || !newSeasonal.endDate || !newSeasonal.price) ? 0.5 : 1 }}>
                                    <Plus size={16} /> Ajouter
                                </button>
                            </div>

                            {/* List */}
                            {seasonal.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--light)', padding: '24px', fontSize: '14px' }}>Aucun prix saisonnier configuré</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {seasonal.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                                            <TrendingUp size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <p style={{ fontWeight: '600', fontSize: '14px', margin: 0 }}>{fmt(s.startDate)} → {fmt(s.endDate)}</p>
                                                    {s.label && <span style={{ fontSize: '11px', background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{s.label}</span>}
                                                </div>
                                                <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: '700', margin: '2px 0 0' }}>{s.price} {listing.pricing.currency}/nuit</p>
                                            </div>
                                            <button onClick={() => setSeasonal(prev => prev.filter((_, j) => j !== i))}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '14px' }}>
                        Fermer
                    </button>
                    <button
                        onClick={tab === 'blocks' ? saveBlocks : saveSeasonal}
                        disabled={mutation.isPending}
                        style={{ padding: '10px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', opacity: mutation.isPending ? 0.7 : 1 }}
                    >
                        {mutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
};

export default ListingEditPanel;
