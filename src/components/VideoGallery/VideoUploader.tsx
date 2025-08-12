import React, { useState } from 'react';
import { uploadVideo } from '../../services/videoService';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    setVideoFile(file || null);
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = e.target.files ? Array.from(e.target.files) : [];
    setAudioFiles(files);
  };
  
  const handleSubtitleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSubtitleFiles(files);
  };

  const handleUploadAndSave = async () => {
    if (!videoFile) {
      setError('Por favor, selecciona un video.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('description', description);
    
    audioFiles.forEach((file, index) => {
      formData.append(`audioTracks[${index}]`, file);
    });
    
    subtitleFiles.forEach((file, index) => {
      formData.append(`subtitleTracks[${index}]`, file);
    });

    try {
      // Usar el servicio de video
      await uploadVideo(formData);
      onUploadSuccess();
      
    } catch (error) {
      console.error("Error al subir el video:", error);
      setError(error instanceof Error ? error.message : 'Error desconocido al subir el video');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <h3 className={styles.uploaderTitle}>Sube tu Video a la Base de Datos</h3>
      
      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.inputGroup}>
        <label>Video (MP4, WebM, Ogg):</label>
        <input 
          type="file" 
          accept="video/mp4,video/webm,video/ogg" 
          onChange={handleVideoFileChange} 
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label>Pistas de Audio (MP3, Ogg, WAV - opcional):</label>
        <input 
          type="file" 
          accept="audio/mpeg,audio/ogg,audio/wav" 
          multiple 
          onChange={handleAudioFileChange} 
        />
        {audioFiles.length > 0 && (
          <div className={styles.fileList}>
            <p>Archivos de audio seleccionados:</p>
            <ul>
              {audioFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className={styles.inputGroup}>
        <label>Subtítulos (VTT - opcional):</label>
        <input 
          type="file" 
          accept=".vtt" 
          multiple 
          onChange={handleSubtitleFileChange} 
        />
        {subtitleFiles.length > 0 && (
          <div className={styles.fileList}>
            <p>Archivos de subtítulos seleccionados:</p>
            <ul>
              {subtitleFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Añade una descripción (opcional)..."
        className={styles.descriptionInput}
        rows={4}
      />

      <div className={styles.buttonGroup}>
        <button 
          onClick={handleUploadAndSave} 
          className={styles.uploadButton} 
          disabled={!videoFile || isLoading}
        >
          {isLoading ? 'Subiendo...' : 'Añadir al Carrusel'}
        </button>
        <button 
          onClick={onCancel} 
          className={styles.cancelButton} 
          disabled={isLoading}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default VideoUploader;