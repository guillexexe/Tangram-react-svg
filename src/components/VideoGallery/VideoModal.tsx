// src/components/VideoModal.tsx

import React, { useRef, useEffect } from 'react';
import styles from './VideoCarousel.module.css';

interface VideoModalProps {
  video: {
    videoUrl: string;
    title: string;
    audioTracks: { src: string; label: string }[];
    subtitleTracks: { src: string; label: string; srclang: string }[];
  };
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ video, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        if (videoElement.paused) videoElement.play();
        else videoElement.pause();
      }
    };

    videoElement.muted = true;
    const playPromise = videoElement.play();

    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.warn("Autoplay bloqueado:", e);
        videoElement.muted = false;
      });
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
    };
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Cerrar reproductor"
        >
          &times;
        </button>

        <div className={styles.videoWrapper}>
          <video
            ref={videoRef}
            controls
            autoPlay
            className={styles.videoPlayer}
            playsInline
          >
            {/* Pista de video principal */}
            <source src={video.videoUrl} type="video/mp4" />

            {/* Pistas de audio adicionales */}
            {video.audioTracks.map((track, index) => (
              <source
                key={index}
                src={track.src}
                type="audio/mp3"
                label={track.label}
              />
            ))}

            {/* Pistas de subtítulos */}
            {video.subtitleTracks.map((track, index) => (
              <track
                key={index}
                kind="subtitles"
                src={track.src}
                srcLang={track.srclang}
                label={track.label}
              />
            ))}
            
            Tu navegador no soporta el elemento de video.
          </video>
        </div>

        <h2 className={styles.videoTitleModal}>{video.title}</h2>
      </div>
    </div>
  );
};

export default VideoModal;