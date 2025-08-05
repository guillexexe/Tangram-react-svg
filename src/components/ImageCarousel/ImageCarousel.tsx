// ImageCarousel.tsx
import React, { useState, useEffect } from 'react';
import ImageUploader from './imageUploader';
import styles from './ImageCarousel.module.css';

interface CarouselItem {
  id: string;
  imageSrc: string;
  description: string;
}

// Número mínimo de imágenes requerido para mostrar el carrusel
const MIN_IMAGES = 2; 

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

  useEffect(() => {
    try {
      localStorage.setItem('carouselImages', JSON.stringify(items));
      if (activeIndex >= items.length) {
        setActiveIndex(Math.max(0, items.length - 1));
      }
    } catch (error) {
      console.error("Error al guardar las imágenes en el almacenamiento local", error);
    }
  }, [items, activeIndex]);

  const handleAddImage = (croppedImage: string, description: string) => {
    const newItem = {
      id: new Date().toISOString(),
      imageSrc: croppedImage,
      description: description
    };
    setItems(currentItems => [...currentItems, newItem]);
    setView('carousel');
    setActiveIndex(items.length);
  };

  const handleNext = () => {
    if (items.length > 0) {
      setActiveIndex((prevIndex) => (prevIndex + 1) % items.length);
    }
  };

  const handlePrev = () => {
    if (items.length > 0) {
      setActiveIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
    }
  };

  const handleRemove = (idToRemove: string) => {
    const updatedItems = items.filter(item => item.id !== idToRemove);
    setItems(updatedItems);
  };
  
  const handleCancelUpload = () => {
    setView('carousel');
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
          
          {items.length >= MIN_IMAGES ? (
            <div className={styles.carouselDisplay}>
              {/* ... (aquí se muestra el carrusel completo, sin cambios) ... */}
              <div 
                className={styles.carouselInner} 
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {items.map((item) => (
                  <div key={item.id} className={styles.imageCard}>
                    <img 
                      src={item.imageSrc} 
                      alt={item.description || `Diseño ${item.id}`} 
                      className={styles.carouselImage} 
                    />
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
                  className={`${styles.navButton} ${styles.prevButton}`}
                  aria-label="Imagen anterior"
                >
                  &#8249;
                </button>
                <button 
                  onClick={handleNext} 
                  className={`${styles.navButton} ${styles.nextButton}`}
                  aria-label="Siguiente imagen"
                >
                  &#8250;
                </button>
              </div>
              
              <div className={styles.dotsContainer}>
                {items.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.dot} ${index === activeIndex ? styles.activeDot : ''}`}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Ver imagen ${index + 1}`}
                  ></button>
                ))}
              </div>
            </div>
          ) : (
            <p className={styles.emptyMessage}>
              Se requiere un mínimo de {MIN_IMAGES} imágenes para mostrar el carrusel. Actualmente tienes {items.length}.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default ImageCarousel;