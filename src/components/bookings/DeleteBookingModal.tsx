import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import styles from './BookingModals.module.css';

interface DeleteBookingModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    bookingId: string;
    isDeleting: boolean;
}

const DeleteBookingModal: React.FC<DeleteBookingModalProps> = ({
    show,
    onClose,
    onConfirm,
    bookingId,
    isDeleting
}) => {
    const [confirmText, setConfirmText] = useState('');
    const isConfirmValid = confirmText.toLowerCase() === 'supprimer';

    if (!show) return null;

    const handleConfirm = () => {
        if (isConfirmValid) {
            onConfirm();
        }
    };

    return ReactDOM.createPortal(
        <>
            <div className={styles.modalOverlay} style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
            <div className={styles.modalContainerUser}>
                <div className={styles.modalContentUser}>
                    <div className={styles.modalHeader} style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}>
                        <div>
                            <h2 className={styles.modalTitle}>Supprimer la réservation</h2>
                            <p className={styles.modalSubtitle}>Cette action est irréversible</p>
                        </div>
                        <button className={styles.closeButton} onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className={styles.modalBody}>
                        <div className={styles.formContainerUser}>
                            {/* Avertissement */}
                            <div style={{
                                background: '#fef2f2',
                                border: '2px solid #fecaca',
                                borderRadius: '8px',
                                padding: '16px',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-start'
                            }}>
                                <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
                                <div>
                                    <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#dc2626' }}>
                                        Attention !
                                    </p>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>
                                        Vous êtes sur le point de supprimer définitivement cette réservation. 
                                        Cette action ne peut pas être annulée.
                                    </p>
                                </div>
                            </div>

                            {/* ID de la réservation */}
                            <div style={{
                                background: 'var(--surface)',
                                padding: '12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: 'var(--light)'
                            }}>
                                <strong>ID de la réservation :</strong>
                                <br />
                                <code style={{ 
                                    fontSize: '12px', 
                                    background: 'white', 
                                    padding: '4px 8px', 
                                    borderRadius: '4px',
                                    display: 'inline-block',
                                    marginTop: '4px'
                                }}>
                                    {bookingId}
                                </code>
                            </div>

                            {/* Champ de confirmation */}
                            <div>
                                <label className="input-label">
                                    Pour confirmer, tapez <strong style={{ color: '#dc2626' }}>supprimer</strong>
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="Tapez 'supprimer' pour confirmer"
                                    style={{ 
                                        marginBottom: 0,
                                        borderColor: confirmText && !isConfirmValid ? '#dc2626' : 'var(--border)'
                                    }}
                                    autoFocus
                                />
                                {confirmText && !isConfirmValid && (
                                    <p style={{ 
                                        margin: '6px 0 0 0', 
                                        fontSize: '12px', 
                                        color: '#dc2626' 
                                    }}>
                                        Le texte ne correspond pas
                                    </p>
                                )}
                            </div>

                            {/* Boutons */}
                            <div className={styles.modalFooter}>
                                <button 
                                    className={styles.buttonCancel} 
                                    onClick={onClose}
                                    disabled={isDeleting}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={!isConfirmValid || isDeleting}
                                    style={{
                                        flex: 1,
                                        padding: '14px 24px',
                                        background: isConfirmValid && !isDeleting ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : 'var(--light)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontWeight: '700',
                                        fontSize: '15px',
                                        cursor: isConfirmValid && !isDeleting ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        boxShadow: isConfirmValid && !isDeleting ? '0 4px 12px rgba(220, 38, 38, 0.3)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (isConfirmValid && !isDeleting) {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (isConfirmValid && !isDeleting) {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                                        }
                                    }}
                                >
                                    {isDeleting ? (
                                        <>
                                            <span className={styles.spinner} />
                                            Suppression...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={18} />
                                            Supprimer définitivement
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default DeleteBookingModal;
