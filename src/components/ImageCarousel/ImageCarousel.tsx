// src/components/ImageCarousel.tsx

import React, { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';
import ImageModal from './ImageModal';
import styles from './ImageCarousel.module.css';

interface CarouselItem {
    id: string;
    imageSrc: string;
    description: string;
    fileName: string;
    fileSize: number;
    dimensions: string;
    format: string;
}

const ImageCarousel: React.FC = () => {
    const [view, setView] = useState<'carousel' | 'uploader'>('carousel');
    const [items, setItems] = useState<CarouselItem[]>(() => {
        try {
            const storedItems = localStorage.getItem('carouselImages');
            return storedItems ? JSON.parse(storedItems) : [];
        } catch (error) {
            console.error("Error al cargar las imágenes desde el almacenamiento local", error);
            return [];
        }
    });

    const [activeIndex, setActiveIndex] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<CarouselItem | null>(null);
    const [slidesToShow, setSlidesToShow] = useState(3);

    useEffect(() => {
        try {
            localStorage.setItem('carouselImages', JSON.stringify(items));
            if (activeIndex >= items.length) {
                setActiveIndex(Math.max(0, items.length - slidesToShow));
            }
        } catch (error) {
            console.error("Error al guardar las imágenes en el almacenamiento local", error);
        }
    }, [items, activeIndex, slidesToShow]);

    const handleAddImage = (details: { croppedImage: string, description: string, fileName: string, fileSize: number, dimensions: string, format: string }) => {
        const newItem: CarouselItem = {
            id: new Date().toISOString(),
            imageSrc: details.croppedImage,
            description: details.description,
            fileName: details.fileName,
            fileSize: details.fileSize,
            dimensions: details.dimensions,
            format: details.format,
        };
        setItems(currentItems => [...currentItems, newItem]);
        setView('carousel');
        setActiveIndex(Math.max(0, items.length - slidesToShow + 1));
    };

    const handleNext = () => {
        if (items.length > slidesToShow && activeIndex < items.length - slidesToShow) {
            setActiveIndex(prevIndex => prevIndex + 1);
        }
    };

    const handlePrev = () => {
        if (activeIndex > 0) {
            setActiveIndex(prevIndex => prevIndex - 1);
        }
    };

    const handleRemove = (idToRemove: string) => {
        const updatedItems = items.filter(item => item.id !== idToRemove);
        setItems(updatedItems);
    };

    const handleCancelUpload = () => {
        setView('carousel');
    };

    const openImageModal = (item: CarouselItem) => {
        setSelectedImage(item);
        setModalOpen(true);
    };

    const closeImageModal = () => {
        setModalOpen(false);
        setSelectedImage(null);
    };

    return (
        <div className={styles.carouselContainer}>
            <h2 className={styles.carouselTitle}>Carrusel de Imágenes Personalizado</h2>
            
            {view === 'uploader' ? (
                <ImageUploader 
                    onImageCropped={handleAddImage}
                    onCancel={handleCancelUpload}
                />
            ) : (
                <>
                    <div className={styles.addPhotoSection}>
                        <button 
                            onClick={() => setView('uploader')} 
                            className={styles.addPhotoButton}
                        >
                            + Añadir Foto
                        </button>
                    </div>
                    
                    {items.length > 0 ? (
                        <div className={styles.carouselDisplay}>
                            <div 
                                className={styles.carouselInner} 
                                style={{ 
                                    transform: `translateX(-${activeIndex * (100 / slidesToShow)}%)`,
                                    width: `${(100 / slidesToShow) * items.length}%`
                                }}
                            >
                                {items.map((item) => (
                                    <div key={item.id} className={styles.imageCard} style={{ width: `${100 / items.length}%` }}>
                                        <button 
                                            onClick={() => openImageModal(item)} 
                                            className={styles.imageButton}
                                        >
                                            <img 
                                                src={item.imageSrc} 
                                                alt={item.description || `Diseño ${item.id}`} 
                                                className={styles.carouselImage} 
                                            />
                                        </button>
                                        <p className={styles.imageDescription}>{item.description}</p>
                                        <button 
                                            onClick={() => handleRemove(item.id)} 
                                            className={styles.removeButton}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.carouselControls}>
                                <button 
                                    onClick={handlePrev} 
                                    className={`${styles.navButton} ${styles.prevButton} ${activeIndex === 0 ? styles.disabled : ''}`}
                                    aria-label="Imagen anterior"
                                    disabled={activeIndex === 0}
                                >
                                    &#8249;
                                </button>
                                <button 
                                    onClick={handleNext} 
                                    className={`${styles.navButton} ${styles.nextButton} ${activeIndex >= items.length - slidesToShow ? styles.disabled : ''}`}
                                    aria-label="Siguiente imagen"
                                    disabled={activeIndex >= items.length - slidesToShow}
                                >
                                    &#8250;
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className={styles.emptyMessage}>
                            Aún no hay imágenes. Sube una para comenzar.
                        </p>
                    )}
                </>
            )}

            {modalOpen && selectedImage && (
                <ImageModal 
                    image={selectedImage}
                    onClose={closeImageModal}
                />
            )}
        </div>
    );
};

export default ImageCarousel;