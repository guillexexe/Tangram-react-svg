// src/components/VideoUploader.tsx
import React, { useState } from 'react';
import styles from './VideoCarousel.module.css';

interface VideoTrack {
  src: string;
  kind: 'subtitles' | 'audio';
  label: string;
  srclang?: string;
}

interface VideoUploaderProps {
  onVideoUploaded: (videoData: { videoSrc: string; description: string; tracks: VideoTrack[] }) => void;
  onCancel: () => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoUploaded, onCancel }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [subtitleFiles, setSubtitleFiles] = useState<File[]>([]);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleSubtitleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSubtitleFiles(files);
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setAudioFiles(files);
  };

  const handleUploadAndSave = () => {
    if (!videoFile) {
      alert('Por favor, selecciona un video.');
      return;
    }
    if (subtitleFiles.length < 3) {
      alert('Debes subir un mínimo de 3 archivos de subtítulos.');
      return;
    }

    const videoSrc = URL.createObjectURL(videoFile);
    const tracks: VideoTrack[] = [];

    // Agregar pistas de subtítulos
    subtitleFiles.forEach((file, index) => {
      tracks.push({
        src: URL.createObjectURL(file),
        kind: 'subtitles',
        label: file.name.replace(/\.vtt$/, ''),
        srclang: file.name.split('.')[0] || `sub${index + 1}`
      });
    });

    // Agregar pistas de audio adicionales
    audioFiles.forEach((file, index) => {
      tracks.push({
        src: URL.createObjectURL(file),
        kind: 'audio',
        label: file.name.replace(/\.mp3$/, '') || `audio${index + 1}`
      });
    });

    onVideoUploaded({ videoSrc, description, tracks });
  };

  return (
    <div className={styles.uploadContainer}>
      <h3 className={styles.uploaderTitle}>Sube tu Video</h3>
      <div className={styles.inputGroup}>
        <label>Video:</label>
        <input type="file" accept="video/*" onChange={handleVideoFileChange} />
      </div>

      <div className={styles.inputGroup}>
        <label>Subtítulos (.vtt): (Mínimo 3)</label>
        <input type="file" accept=".vtt" multiple onChange={handleSubtitleFileChange} />
        {subtitleFiles.length > 0 && (
          <p className={styles.fileCount}>Archivos seleccionados: {subtitleFiles.length}</p>
        )}
      </div>

      <div className={styles.inputGroup}>
        <label>Pistas de Audio (.mp3, opcional):</label>
        <input type="file" accept="audio/*" multiple onChange={handleAudioFileChange} />
        {audioFiles.length > 0 && (
          <p className={styles.fileCount}>Archivos seleccionados: {audioFiles.length}</p>
        )}
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Añade una descripción (opcional)..."
        className={styles.descriptionInput}
      />

      <div className={styles.buttonGroup}>
        <button onClick={handleUploadAndSave} className={styles.uploadButton} disabled={!videoFile || subtitleFiles.length < 3}>
          Añadir al Carrusel
        </button>
        <button onClick={onCancel} className={styles.cancelButton}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default VideoUploader;