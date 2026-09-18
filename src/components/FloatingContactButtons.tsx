import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import styles from './FloatingContactButtons.module.css';

const FloatingContactButtons: React.FC = () => {
    return (
        <div className={styles.floatingContactButtons}>
            <a
                href="https://wa.me/33763223350"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.floatingWhatsAppBtn}
                title="Contacter via WhatsApp"
            >
                <MessageCircle size={24} />
            </a>
            
            <a
                href="tel:+33763223350"
                className={styles.floatingCallBtn}
                title="Appeler +33 7 63 22 33 50"
            >
                <Phone size={24} />
            </a>
        </div>
    );
};

export default FloatingContactButtons;
