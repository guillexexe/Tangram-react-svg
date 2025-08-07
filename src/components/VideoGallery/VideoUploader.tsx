// src/components/VideoUploader.tsx

import React, { useState } from 'react';
import styles from './VideoCarousel.module.css';

interface VideoUploaderProps {
  onUploadSuccess: () => void;
  onCancel: () => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onUploadSuccess, onCancel }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [subtitleFiles, setSubtitleFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setAudioFiles(files);
  };
  
  const handleSubtitleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSubtitleFiles(files);
  };

  const handleUploadAndSave = async () => {
    if (!videoFile) {
      alert('Por favor, selecciona un video.');
      return;
    }
    
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('description', description);
    
    audioFiles.forEach((file) => {
      formData.append('audioTracks[]', file);
    });
    
    subtitleFiles.forEach((file) => {
      formData.append('subtitleTracks[]', file);
    });

    try {
      const response = await fetch('http://localhost/mi-proyecto-backend/upload.php', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'La subida de archivos falló.');
      }

      onUploadSuccess();
      
    } catch (error) {
      console.error("Error al subir el video:", error);
      alert("Hubo un error al subir los archivos: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <h3 className={styles.uploaderTitle}>Sube tu Video a la Base de Datos</h3>
      <div className={styles.inputGroup}>
        <label>Video:</label>
        <input type="file" accept="video/*" onChange={handleVideoFileChange} />
      </div>

      <div className={styles.inputGroup}>
        <label>Pistas de Audio (.mp3, opcional):</label>
        <input type="file" accept="audio/*" multiple onChange={handleAudioFileChange} />
        {audioFiles.length > 0 && (
          <p className={styles.fileCount}>Archivos de audio seleccionados: {audioFiles.length}</p>
        )}
      </div>
      
      <div className={styles.inputGroup}>
        <label>Subtítulos (.vtt, opcional):</label>
        <input type="file" accept=".vtt" multiple onChange={handleSubtitleFileChange} />
        {subtitleFiles.length > 0 && (
          <p className={styles.fileCount}>Archivos de subtítulos seleccionados: {subtitleFiles.length}</p>
        )}
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Añade una descripción (opcional)..."
        className={styles.descriptionInput}
      />

      <div className={styles.buttonGroup}>
        <button 
          onClick={handleUploadAndSave} 
          className={styles.uploadButton} 
          disabled={!videoFile || isLoading}
        >
          {isLoading ? 'Subiendo...' : 'Añadir al Carrusel'}
        </button>
        <button onClick={onCancel} className={styles.cancelButton} disabled={isLoading}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default VideoUploader;