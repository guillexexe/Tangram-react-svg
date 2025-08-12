// src/components/ImageModal.tsx

import React, { useRef, useEffect } from 'react';
import styles from './ImageCarousel.module.css';

interface ImageModalProps {
    image: {
        id: string;
        imageSrc: string;
        description: string;
        fileName: string;
        fileSize: number;
        dimensions: string;
        format: string;
    };
    onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div className={styles.modalOverlay} onClick={onClose} ref={modalRef}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button 
                    className={styles.closeButton} 
                    onClick={onClose} 
                    aria-label="Cerrar imagen"
                >
                    &times;
                </button>
                
                <h3 className={styles.modalTitle}>{image.description || "Imagen sin descripción"}</h3>

                <div className={styles.imageWrapper}>
                    <img 
                        src={image.imageSrc} 
                        alt={image.description || `Imagen ${image.id}`}
                        className={styles.modalImage}
                    />
                </div>

                <div className={styles.imageDetails}>
                    <h4>Detalles de la imagen:</h4>
                    <p><strong>Nombre:</strong> <span>{image.fileName}</span></p>
                    <p><strong>Formato:</strong> <span>{image.format}</span></p>
                    <p><strong>Dimensiones originales:</strong> <span>{image.dimensions}</span></p>
                    <p><strong>Tamaño:</strong> <span>{(image.fileSize / 1024).toFixed(2)} KB</span></p>
                </div>

            </div>
        </div>
    );
};

export default ImageModal;