import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBooking, getAllUsers, getAllListings, createUser, getOccupiedDates } from '../services/adminService';
import type { User, Listing } from '../types';
import { ArrowLeft, Check, Plus, UserPlus, Search, ChevronDown, X, CheckCircle, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error';
interface Toast { id: number; message: string; type: ToastType; }

// ── User search ──────────────────────────────────────────────────────────────
const UserSearchField: React.FC<{
    users: User[];
    selectedUserId: string;
    onSelect: (id: string) => void;
    onShowCreateUser: () => void;
}> = ({ users, selectedUserId, onSelect, onShowCreateUser }) => {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = users.find(u => u._id === selectedUserId);
    const filtered = search
        ? users.filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
        : users;

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div style={{ position: 'relative' }} ref={ref}>
            <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder={selected ? `${selected.firstName} ${selected.lastName} (${selected.email})` : 'Rechercher un utilisateur...'}
                        value={open ? search : (selected ? `${selected.firstName} ${selected.lastName} (${selected.email})` : '')}
                        onChange={e => { setSearch(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        style={{ paddingRight: '40px', borderColor: selectedUserId ? 'var(--success)' : undefined, marginBottom: 0 }}
                    />
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
                        <Search size={16} color="var(--light)" /><ChevronDown size={16} color="var(--light)" />
                    </div>
                </div>
                <button type="button" onClick={onShowCreateUser} style={{
                    padding: '0 16px', border: '1px dashed var(--border)', borderRadius: '8px',
                    background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    gap: '6px', fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap'
                }}>
                    <Plus size={16} /> Nouveau
                </button>
            </div>
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, background: 'white',
                    border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    maxHeight: '220px', overflowY: 'auto', zIndex: 100, marginTop: '4px'
                }}>
                    {filtered.length > 0 ? filtered.map(u => (
                        <div key={u._id} onClick={() => { onSelect(u._id); setSearch(''); setOpen(false); }}
                            style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', background: selectedUserId === u._id ? '#fef2f2' : 'transparent' }}
                            onMouseEnter={e => { if (selectedUserId !== u._id) e.currentTarget.style.background = '#f9fafb'; }}
                            onMouseLeave={e => { if (selectedUserId !== u._id) e.currentTarget.style.background = 'transparent'; }}>
                            <div style={{ fontWeight: '500', fontSize: '14px' }}>{u.firstName} {u.lastName}</div>
                            <div style={{ color: 'var(--light)', fontSize: '12px' }}>{u.email}</div>
                        </div>
                    )) : (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--light)', fontSize: '14px' }}>Aucun utilisateur trouvé</div>
                    )}
                </div>
            )}
            {selectedUserId && (
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '13px' }}>
                    <Check size={14} /> Utilisateur sélectionné
                </div>
            )}
        </div>
    );
};

// ── Listing search ───────────────────────────────────────────────────────────
const ListingSearchField: React.FC<{
    listings: Listing[];
    selectedListingId: string;
    onSelect: (id: string) => void;
}> = ({ listings, selectedListingId, onSelect }) => {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = listings.find(l => l._id === selectedListingId);
    const filtered = search
        ? listings.filter(l => `${l.title} ${l.address.city} ${l.address.country}`.toLowerCase().includes(search.toLowerCase()))
        : listings;

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div style={{ position: 'relative' }} ref={ref}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    className="input-field"
                    placeholder={selected ? `${selected.title} - ${selected.pricing.basePrice} ${selected.pricing.currency}/nuit` : 'Rechercher une annonce...'}
                    value={open ? search : (selected ? `${selected.title} - ${selected.pricing.basePrice} ${selected.pricing.currency}/nuit` : '')}
                    onChange={e => { setSearch(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    style={{ paddingRight: '40px', borderColor: selectedListingId ? 'var(--success)' : undefined, marginBottom: 0 }}
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
                    <Search size={16} color="var(--light)" /><ChevronDown size={16} color="var(--light)" />
                </div>
            </div>
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, background: 'white',
                    border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    maxHeight: '280px', overflowY: 'auto', zIndex: 100, marginTop: '4px'
                }}>
                    {filtered.length > 0 ? filtered.map(l => (
                        <div key={l._id} onClick={() => { onSelect(l._id); setSearch(''); setOpen(false); }}
                            style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '12px', alignItems: 'center', background: selectedListingId === l._id ? '#fef2f2' : 'transparent' }}
                            onMouseEnter={e => { if (selectedListingId !== l._id) e.currentTarget.style.background = '#f9fafb'; }}
                            onMouseLeave={e => { if (selectedListingId !== l._id) e.currentTarget.style.background = 'transparent'; }}>
                            {l.images[0] && <img src={l.images.find(i => i.isPrimary)?.url || l.images[0].url} alt={l.title} style={{ width: '50px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />}
                            <div>
                                <div style={{ fontWeight: '500', fontSize: '14px' }}>{l.title}</div>
                                <div style={{ color: 'var(--light)', fontSize: '12px' }}>{l.address.city}, {l.address.country}</div>
                                <div style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: '600' }}>{l.pricing.basePrice} {l.pricing.currency}/nuit</div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--light)', fontSize: '14px' }}>Aucune annonce trouvée</div>
                    )}
                </div>
            )}
            {selected && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {selected.images[0] && <img src={selected.images.find(i => i.isPrimary)?.url || selected.images[0].url} alt={selected.title} style={{ width: '60px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />}
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{selected.title}</div>
                        <div style={{ color: 'var(--light)', fontSize: '12px' }}>{selected.address.city}, {selected.address.country}</div>
                        <div style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: '600' }}>{selected.pricing.basePrice} {selected.pricing.currency}/nuit</div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Create User inline panel ─────────────────────────────────────────────────
const CreateUserPanel: React.FC<{
    onCreated: (userId: string) => void;
    onCancel: () => void;
}> = ({ onCreated, onCancel }) => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createUser,
        onSuccess: (newUser: any) => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            onCreated(newUser._id);
        }
    });

    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '15px' }}>
                    <UserPlus size={18} color="var(--primary)" /> Nouvel utilisateur
                </div>
                <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--light)' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
                <input type="email" className="input-field" placeholder="Email *" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: 0 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="text" className="input-field" placeholder="Prénom *" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ marginBottom: 0 }} />
                    <input type="text" className="input-field" placeholder="Nom *" value={lastName} onChange={e => setLastName(e.target.value)} style={{ marginBottom: 0 }} />
                </div>
                <input type="tel" className="input-field" placeholder="Téléphone" value={phone} onChange={e => setPhone(e.target.value)} style={{ marginBottom: 0 }} />
                <input type="password" className="input-field" placeholder="Mot de passe * (min. 6 caractères)" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: 0 }} />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '14px' }}>Annuler</button>
                    <button
                        onClick={() => mutation.mutate({ email, firstName, lastName, phone, password, role: 'guest' })}
                        disabled={mutation.isPending || !email || !firstName || !lastName || !password}
                        style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', opacity: mutation.isPending ? 0.7 : 1 }}
                    >
                        {mutation.isPending ? 'Création...' : 'Créer'}
                    </button>
                </div>
                {mutation.isError && <p style={{ color: 'var(--error)', fontSize: '13px', margin: 0 }}>{(mutation.error as any)?.response?.data?.message || 'Erreur'}</p>}
            </div>
        </div>
    );
};

// ── Mini Calendar (interactif) ───────────────────────────────────────────────
const MiniCalendar: React.FC<{
    occupiedDates: { date: string; status: string }[];
    checkIn: string;
    checkOut: string;
    onSelectCheckIn: (date: string) => void;
    onSelectCheckOut: (date: string) => void;
}> = ({ occupiedDates, checkIn, checkOut, onSelectCheckIn, onSelectCheckOut }) => {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [selecting, setSelecting] = useState<'checkIn' | 'checkOut'>('checkIn');

    const occupiedSet = new Set(
        occupiedDates.map(d => new Date(d.date).toISOString().split('T')[0])
    );
    const today = new Date(new Date().toDateString());
    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const getDateStr = (day: number) =>
        `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const handleDayClick = (day: number) => {
        const dateStr = getDateStr(day);
        const date = new Date(dateStr);
        if (date < today || occupiedSet.has(dateStr)) return;

        if (selecting === 'checkIn') {
            onSelectCheckIn(dateStr);
            onSelectCheckOut('');
            setSelecting('checkOut');
        } else {
            if (checkInDate && date <= checkInDate) {
                onSelectCheckIn(dateStr);
                onSelectCheckOut('');
                setSelecting('checkOut');
            } else {
                onSelectCheckOut(dateStr);
                setSelecting('checkIn');
            }
        }
    };

    const getDayStyle = (day: number | null): React.CSSProperties => {
        if (!day) return {};
        const dateStr = getDateStr(day);
        const date = new Date(dateStr);
        const isOccupied = occupiedSet.has(dateStr);
        const isPast = date < today;
        const isCheckIn = checkInDate && date.toDateString() === checkInDate.toDateString();
        const isCheckOut = checkOutDate && date.toDateString() === checkOutDate.toDateString();
        const isInRange = checkInDate && checkOutDate && date > checkInDate && date < checkOutDate;

        if (isCheckIn) return { background: 'var(--primary)', color: 'white', borderRadius: '50%', fontWeight: '700', cursor: 'pointer' };
        if (isCheckOut) return { background: 'var(--primary)', color: 'white', borderRadius: '50%', fontWeight: '700', cursor: 'pointer' };
        if (isInRange) return { background: '#ffe4e8', color: 'var(--primary)', borderRadius: '4px', cursor: 'pointer' };
        if (isOccupied) return { background: '#fee2e2', color: '#dc2626', borderRadius: '50%', textDecoration: 'line-through', fontSize: '11px', cursor: 'not-allowed' };
        if (isPast) return { color: '#ccc', cursor: 'not-allowed' };
        return { cursor: 'pointer', borderRadius: '50%' };
    };

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', background: '#fafafa' }}>
            {/* Indicateur de sélection */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <div style={{
                    flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center',
                    border: `2px solid ${selecting === 'checkIn' ? 'var(--primary)' : 'var(--border)'}`,
                    background: selecting === 'checkIn' ? '#fff5f7' : 'white',
                    fontWeight: selecting === 'checkIn' ? '600' : '400'
                }}>
                    Check-in {checkIn ? <span style={{ color: 'var(--primary)' }}>{checkIn}</span> : <span style={{ color: 'var(--light)' }}>—</span>}
                </div>
                <div style={{
                    flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center',
                    border: `2px solid ${selecting === 'checkOut' ? 'var(--primary)' : 'var(--border)'}`,
                    background: selecting === 'checkOut' ? '#fff5f7' : 'white',
                    fontWeight: selecting === 'checkOut' ? '600' : '400'
                }}>
                    Check-out {checkOut ? <span style={{ color: 'var(--primary)' }}>{checkOut}</span> : <span style={{ color: 'var(--light)' }}>—</span>}
                </div>
            </div>

            {/* Navigation mois */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '16px' }}>‹</button>
                <span style={{ fontWeight: '600', fontSize: '14px' }}>{monthNames[month]} {year}</span>
                <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '16px' }}>›</button>
            </div>

            {/* Grille */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(d => (
                    <div key={d} style={{ fontSize: '11px', fontWeight: '600', color: 'var(--light)', padding: '4px 0' }}>{d}</div>
                ))}
                {days.map((day, i) => {
                    const isOccupied = day ? occupiedSet.has(getDateStr(day)) : false;
                    const isPast = day ? new Date(getDateStr(day)) < today : false;
                    return (
                        <div key={i}
                            onClick={() => day && !isOccupied && !isPast && handleDayClick(day)}
                            onMouseEnter={e => {
                                if (day && !isOccupied && !isPast) {
                                    const dateStr = getDateStr(day);
                                    const isSelected = (checkIn === dateStr || checkOut === dateStr);
                                    if (!isSelected) e.currentTarget.style.background = '#f3f4f6';
                                }
                            }}
                            onMouseLeave={e => {
                                const dateStr = day ? getDateStr(day) : '';
                                const isSelected = (checkIn === dateStr || checkOut === dateStr);
                                if (!isSelected) e.currentTarget.style.background = '';
                            }}
                            style={{
                                padding: '5px 2px', fontSize: '12px', minHeight: '30px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.1s',
                                ...getDayStyle(day)
                            }}>
                            {day || ''}
                        </div>
                    );
                })}
            </div>

            {/* Légende */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--light)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fee2e2', border: '1px solid #dc2626' }} /> Occupé
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--light)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} /> Sélectionné
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--light)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '4px', background: '#ffe4e8' }} /> Période
                </div>
            </div>
        </div>
    );
};

// ── Main page ────────────────────────────────────────────────────────────────
const CreateBookingPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedListingId, setSelectedListingId] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const { data: usersData } = useQuery({ queryKey: ['adminUsers'], queryFn: getAllUsers });
    const { data: listingsData } = useQuery({ queryKey: ['adminListings'], queryFn: () => getAllListings({ status: 'active' }) });
    const { data: occupiedData } = useQuery({
        queryKey: ['occupiedDates', selectedListingId],
        queryFn: () => getOccupiedDates(selectedListingId),
        enabled: !!selectedListingId
    });

    const users: User[] = usersData?.users || [];
    const listings: Listing[] = listingsData?.listings || [];
    const selectedListing = listings.find(l => l._id === selectedListingId);

    const nights = checkIn && checkOut
        ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    const subtotal = selectedListing ? selectedListing.pricing.basePrice * nights : 0;
    const cleaningFee = selectedListing?.pricing.cleaningFee || 0;
    const serviceFee = selectedListing?.pricing.serviceFee || 0;
    const total = subtotal + cleaningFee + serviceFee;

    const mutation = useMutation({
        mutationFn: createBooking,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
            navigate('/admin/bookings');
        },
        onError: (error: any) => {
            showToast(error.response?.data?.message || error.message, 'error');
        }
    });

    const handleSubmit = () => {
        if (!selectedUserId || !selectedListingId || !checkIn || !checkOut) {
            showToast('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }
        if (nights <= 0) {
            showToast('La date de départ doit être après la date d\'arrivée', 'error');
            return;
        }
        if (!selectedListing) return;

        mutation.mutate({
            listing: selectedListingId,
            guest: selectedUserId,
            checkIn,
            checkOut,
            guests: { adults: guests, children: 0, infants: 0, pets: 0 },
            pricing: {
                basePrice: selectedListing.pricing.basePrice,
                nights,
                subtotal,
                cleaningFee,
                serviceFee,
                total,
                currency: selectedListing.pricing.currency
            },
            paymentMethod
        });
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 0 40px' }}>
            {/* Toast modal centré */}
            {toasts.length > 0 && ReactDOM.createPortal(
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.35)', pointerEvents: 'none'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'all' }}>
                        {toasts.map(t => (
                            <div key={t.id} style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                padding: '20px 24px', borderRadius: '12px',
                                minWidth: '340px', maxWidth: '500px',
                                background: t.type === 'error' ? '#fff' : '#fff',
                                borderLeft: `5px solid ${t.type === 'error' ? '#dc2626' : '#16a34a'}`,
                                color: t.type === 'error' ? '#dc2626' : '#16a34a',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.25)'
                            }}>
                                {t.type === 'error' ? <AlertCircle size={24} style={{ flexShrink: 0 }} /> : <CheckCircle size={24} style={{ flexShrink: 0 }} />}
                                <span style={{ fontSize: '15px', flex: 1, color: '#1a1a1a', fontWeight: '500' }}>{t.message}</span>
                                <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0 }}>
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button onClick={() => navigate('/admin/bookings')} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                    border: '1px solid var(--border)', borderRadius: '8px', background: 'white',
                    cursor: 'pointer', fontSize: '14px', color: 'var(--text)'
                }}>
                    <ArrowLeft size={16} /> Retour
                </button>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Nouvelle réservation</h1>
                    <p style={{ color: 'var(--light)', margin: '4px 0 0', fontSize: '14px' }}>Créez une réservation pour un voyageur</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
                {/* Left: form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Voyageur */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserPlus size={18} color="var(--primary)" /> Voyageur
                        </h2>
                        {showCreateUser ? (
                            <CreateUserPanel
                                onCreated={id => { setSelectedUserId(id); setShowCreateUser(false); }}
                                onCancel={() => setShowCreateUser(false)}
                            />
                        ) : (
                            <UserSearchField
                                users={users}
                                selectedUserId={selectedUserId}
                                onSelect={setSelectedUserId}
                                onShowCreateUser={() => setShowCreateUser(true)}
                            />
                        )}
                    </div>

                    {/* Annonce */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Annonce</h2>
                        <ListingSearchField listings={listings} selectedListingId={selectedListingId} onSelect={setSelectedListingId} />
                    </div>

                    {/* Dates & voyageurs */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Dates & voyageurs</h2>

                        {selectedListingId && (
                            <MiniCalendar
                                occupiedDates={occupiedData?.occupiedDates || []}
                                checkIn={checkIn}
                                checkOut={checkOut}
                                onSelectCheckIn={setCheckIn}
                                onSelectCheckOut={setCheckOut}
                            />
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0' }}>
                            <div>
                                <label className="input-label">Check-in <span style={{ color: 'var(--error)' }}>*</span></label>
                                <input type="date" className="input-field" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]} style={{ marginBottom: 0 }} />
                            </div>
                            <div>
                                <label className="input-label">Check-out <span style={{ color: 'var(--error)' }}>*</span></label>
                                <input type="date" className="input-field" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                                    min={checkIn || new Date().toISOString().split('T')[0]} style={{ marginBottom: 0 }} />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Nombre de voyageurs</label>
                            <input type="number" className="input-field" value={guests} onChange={e => setGuests(parseInt(e.target.value))}
                                min="1" max={selectedListing?.capacity.guests || 20} style={{ marginBottom: 0 }} />
                            {selectedListing && <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--light)' }}>Capacité max : {selectedListing.capacity.guests} voyageurs</p>}
                        </div>
                    </div>

                    {/* Méthode de paiement */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Méthode de paiement</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            {[
                                { value: 'cash', icon: '💵', label: 'Espèces', desc: 'Paiement en liquide' },
                                { value: 'konnect', icon: '🏦', label: 'Konnect', desc: 'Paiement mobile TN' },
                                { value: 'stripe', icon: '💳', label: 'Stripe', desc: 'Carte bancaire' },
                            ].map(opt => (
                                <div key={opt.value} onClick={() => setPaymentMethod(opt.value)} style={{
                                    padding: '16px 12px', border: `2px solid ${paymentMethod === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                                    borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                                    background: paymentMethod === opt.value ? '#fff5f7' : 'white',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>{opt.icon}</div>
                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{opt.label}</div>
                                    <div style={{ color: 'var(--light)', fontSize: '12px', marginTop: '2px' }}>{opt.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: summary */}
                <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="card" style={{ padding: '24px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Résumé</h2>
                        {selectedListing && nights > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span>{selectedListing.pricing.basePrice} {selectedListing.pricing.currency} × {nights} nuit{nights > 1 ? 's' : ''}</span>
                                    <span style={{ fontWeight: '600' }}>{subtotal} {selectedListing.pricing.currency}</span>
                                </div>
                                {cleaningFee > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span>Frais de ménage</span>
                                        <span style={{ fontWeight: '600' }}>{cleaningFee} {selectedListing.pricing.currency}</span>
                                    </div>
                                )}
                                {serviceFee > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span>Frais de service</span>
                                        <span style={{ fontWeight: '600' }}>{serviceFee} {selectedListing.pricing.currency}</span>
                                    </div>
                                )}
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px' }}>
                                    <span>Total</span>
                                    <span style={{ color: 'var(--primary)' }}>{total} {selectedListing.pricing.currency}</span>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--light)', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
                                Sélectionnez une annonce et des dates pour voir le résumé
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={mutation.isPending || !selectedUserId || !selectedListingId || !checkIn || !checkOut || nights <= 0}
                        className="btn-primary"
                        style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '600', opacity: (mutation.isPending || !selectedUserId || !selectedListingId || !checkIn || !checkOut || nights <= 0) ? 0.6 : 1 }}
                    >
                        {mutation.isPending ? 'Création en cours...' : 'Créer la réservation'}
                    </button>

                    <button onClick={() => navigate('/admin/bookings')} style={{
                        width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px',
                        background: 'white', cursor: 'pointer', fontSize: '14px', color: 'var(--text)'
                    }}>
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateBookingPage;
