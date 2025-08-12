// src/components/ImageUploader.tsx

import React, { useState, useRef, useEffect } from 'react';
import styles from './ImageCarousel.module.css';

interface ImageDetails {
    croppedImage: string;
    description: string;
    fileName: string;
    fileSize: number;
    dimensions: string;
    format: string;
}

interface ImageUploaderProps {
    onImageCropped: (details: ImageDetails) => void;
    onCancel: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageCropped, onCancel }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageOriginal, setImageOriginal] = useState<HTMLImageElement | null>(null);
    const [description, setDescription] = useState('');
    const [recorteInfo, setRecorteInfo] = useState({ width: 0, height: 0 });

    const lienzoRef = useRef<HTMLCanvasElement>(null);
    const seleccion = useRef({ x1: 0, y1: 0, x2: 0, y2: 0, arrastrando: false });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    setImageOriginal(img);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (imageOriginal && lienzoRef.current) {
            const lienzo = lienzoRef.current;
            const ctx = lienzo.getContext('2d');
            if (ctx) {
                lienzo.width = imageOriginal.width;
                lienzo.height = imageOriginal.height;
                ctx.drawImage(imageOriginal, 0, 0);
            }
        }
    }, [imageOriginal]);

    const iniciarSeleccion = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!imageOriginal) return;
        const rect = lienzoRef.current?.getBoundingClientRect();
        if (!rect) return;
        seleccion.current.x1 = seleccion.current.x2 = e.clientX - rect.left;
        seleccion.current.y1 = seleccion.current.y2 = e.clientY - rect.top;
        seleccion.current.arrastrando = true;
    };

    const dibujarSeleccion = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!seleccion.current.arrastrando || !imageOriginal || !lienzoRef.current) return;
        const rect = lienzoRef.current.getBoundingClientRect();
        seleccion.current.x2 = e.clientX - rect.left;
        seleccion.current.y2 = e.clientY - rect.top;
        const ctx = lienzoRef.current.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, lienzoRef.current.width, lienzoRef.current.height);
            ctx.drawImage(imageOriginal, 0, 0);
            const x = Math.min(seleccion.current.x1, seleccion.current.x2);
            const y = Math.min(seleccion.current.y1, seleccion.current.y2);
            const width = Math.abs(seleccion.current.x2 - seleccion.current.x1);
            const height = Math.abs(seleccion.current.y2 - seleccion.current.y1);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, width, height);
            ctx.setLineDash([]);
            setRecorteInfo({ width, height });
        }
    };

    const finalizarSeleccion = () => {
        seleccion.current.arrastrando = false;
    };

    const handleRecortar = () => {
        if (!imageOriginal || !lienzoRef.current || !imageFile) return;
        const x = Math.min(seleccion.current.x1, seleccion.current.x2);
        const y = Math.min(seleccion.current.y1, seleccion.current.y2);
        const width = Math.abs(seleccion.current.x2 - seleccion.current.x1);
        const height = Math.abs(seleccion.current.y2 - seleccion.current.y1);
        if (width <= 0 || height <= 0) {
            alert('Selecciona un área válida para recortar');
            return;
        }
        const canvasTemp = document.createElement('canvas');
        canvasTemp.width = width;
        canvasTemp.height = height;
        const ctxTemp = canvasTemp.getContext('2d');
        if (ctxTemp) {
            ctxTemp.drawImage(lienzoRef.current, x, y, width, height, 0, 0, width, height);
            const croppedImageUrl = canvasTemp.toDataURL('image/png');
            
            // Aquí se pasa toda la información capturada
            onImageCropped({
                croppedImage: croppedImageUrl,
                description,
                fileName: imageFile.name,
                fileSize: imageFile.size,
                dimensions: `${imageOriginal.width} × ${imageOriginal.height} px`,
                format: imageFile.type,
            });
        }
    };

    return (
        <div className={styles.uploadContainer}>
            {/* ... (el resto del JSX no cambia) ... */}
            <h3 className={styles.uploaderTitle}>Sube y Recorta tu Imagen</h3>
            
            {!imageOriginal ? (
                <div className={styles.initialUploadState}>
                    <label htmlFor="file-upload" className={styles.fileInputLabel}>
                        Seleccionar Archivo
                    </label>
                    <input 
                        id="file-upload"
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className={styles.fileInput}
                    />
                </div>
            ) : (
                <div className={styles.cropperWrapper}>
                    <div className={styles.canvasContainer}>
                        <canvas
                            ref={lienzoRef}
                            onMouseDown={iniciarSeleccion}
                            onMouseMove={dibujarSeleccion}
                            onMouseUp={finalizarSeleccion}
                            onMouseLeave={finalizarSeleccion}
                            className={styles.lienzo}
                        ></canvas>
                    </div>

                    <div className={styles.infoImagen}>
                        <h3>Información de la imagen:</h3>
                        <div className={styles.infoLine}><strong>Nombre:</strong> <span>{imageFile?.name}</span></div>
                        <div className={styles.infoLine}><strong>Tamaño:</strong> <span>{((imageFile?.size ?? 0) / 1024).toFixed(2)} KB</span></div>
                        <div className={styles.infoLine}><strong>Dimensiones originales:</strong> <span>{imageOriginal?.width} × {imageOriginal?.height} px</span></div>
                        <div className={styles.infoLine}><strong>Área seleccionada:</strong> <span>{recorteInfo.width} × {recorteInfo.height} px</span></div>
                    </div>
                    
                    <div className={styles.controls}>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Añade una descripción (opcional)..."
                            className={styles.descriptionInput}
                        />
                        <div className={styles.buttonGroup}>
                            <button 
                                onClick={handleRecortar} 
                                className={styles.cropButton}
                                disabled={recorteInfo.width <= 0 || recorteInfo.height <= 0}
                            >
                                Añadir al Carrusel
                            </button>
                            <button 
                                onClick={onCancel} 
                                className={styles.cancelButton}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;