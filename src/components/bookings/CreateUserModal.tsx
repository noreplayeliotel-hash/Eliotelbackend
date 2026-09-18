import React from 'react';
import { X, UserPlus } from 'lucide-react';
import styles from './BookingModals.module.css';

interface CreateUserModalProps {
    show: boolean;
    onClose: () => void;
    email: string;
    setEmail: (value: string) => void;
    firstName: string;
    setFirstName: (value: string) => void;
    lastName: string;
    setLastName: (value: string) => void;
    phone: string;
    setPhone: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
    onCreateUser: () => void;
    isCreating: boolean;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
    show,
    onClose,
    email,
    setEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    password,
    setPassword,
    onCreateUser,
    isCreating
}) => {
    if (!show) return null;

    return (
        <>
            <div className={styles.modalOverlay} onClick={onClose} />
            <div className={styles.modalContainerUser}>
                <div className={styles.modalContentUser}>
                    <div className={`${styles.modalHeader} ${styles.modalHeaderSecondary}`}>
                        <div>
                            <h2 className={styles.modalTitle}>Nouvel utilisateur</h2>
                            <p className={styles.modalSubtitle}>Créez un compte voyageur</p>
                        </div>
                        <button className={styles.closeButton} onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className={styles.modalBody}>
                        <div className={styles.formContainerUser}>
                            <div>
                                <label className="input-label">
                                    Email <span style={{ color: 'var(--error)' }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@exemple.com"
                                    style={{ marginBottom: 0 }}
                                />
                            </div>

                            <div className={styles.fieldGroupGrid}>
                                <div>
                                    <label className="input-label">
                                        Prénom <span style={{ color: 'var(--error)' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Jean"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">
                                        Nom <span style={{ color: 'var(--error)' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Dupont"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="input-label">Téléphone</label>
                                <input
                                    type="tel"
                                    className="input-field"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+33 6 12 34 56 78"
                                    style={{ marginBottom: 0 }}
                                />
                            </div>

                            <div>
                                <label className="input-label">
                                    Mot de passe <span style={{ color: 'var(--error)' }}>*</span>
                                </label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 6 caractères"
                                    style={{ marginBottom: 0 }}
                                />
                                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--light)' }}>
                                    Le mot de passe doit contenir au moins 6 caractères
                                </p>
                            </div>

                            <div className={styles.modalFooter}>
                                <button className={styles.buttonCancel} onClick={onClose}>
                                    Annuler
                                </button>
                                <button
                                    className={`${styles.buttonSubmit} ${styles.buttonSubmitSecondary}`}
                                    onClick={onCreateUser}
                                    disabled={isCreating}
                                >
                                    {isCreating ? (
                                        <>
                                            <span className={styles.spinner} />
                                            Création...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            Créer l'utilisateur
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateUserModal;
