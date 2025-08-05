// src/components/VideoCarousel.tsx
import React, { useState, useEffect } from 'react';
import styles from './VideoCarousel.module.css';
import VideoUploader from './VideoUploader';
import VideoPlayer from './VideoPlayer';

interface VideoTrack {
  src: string;
  kind: 'subtitles' | 'audio';
  label: string;
  srclang?: string;
}

interface VideoItem {
  id: string;
  videoSrc: string;
  description: string;
  tracks: VideoTrack[];
}

const VideoCarousel: React.FC = () => {
  const [view, setView] = useState<'carousel' | 'uploader'>('carousel');
  const [videos, setVideos] = useState<VideoItem[]>(() => {
    try {
      const storedVideos = localStorage.getItem('videoCarouselItems');
      return storedVideos ? JSON.parse(storedVideos) : [];
    } catch (error) {
      console.error("Error loading videos from local storage", error);
      return [];
    }
  });

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem('videoCarouselItems', JSON.stringify(videos));
      if (activeIndex >= videos.length) {
        setActiveIndex(Math.max(0, videos.length - 1));
      }
    } catch (error) {
      console.error("Error saving videos to local storage", error);
    }
  }, [videos, activeIndex]);

  const handleAddVideo = (videoData: Omit<VideoItem, 'id'>) => {
    const newVideo = {
      ...videoData,
      id: new Date().toISOString(),
    };
    setVideos(currentVideos => [...currentVideos, newVideo]);
    setView('carousel');
    setActiveIndex(videos.length);
  };

  const handleRemoveVideo = (idToRemove: string) => {
    const updatedVideos = videos.filter(video => video.id !== idToRemove);
    setVideos(updatedVideos);
  };

  const handleNext = () => {
    if (videos.length > 0) {
      setActiveIndex((prevIndex) => (prevIndex + 1) % videos.length);
    }
  };

  const handlePrev = () => {
    if (videos.length > 0) {
      setActiveIndex((prevIndex) => (prevIndex - 1 + videos.length) % videos.length);
    }
  };

  return (
    <div className={styles.carouselContainer}>
      <h2 className={styles.carouselTitle}>Carrusel de Videos</h2>
      {view === 'uploader' ? (
        <VideoUploader
          onVideoUploaded={handleAddVideo}
          onCancel={() => setView('carousel')}
        />
      ) : (
        <>
          <div className={styles.addVideoSection}>
            <button onClick={() => setView('uploader')} className={styles.addVideoButton}>
              + Añadir Video
            </button>
          </div>
          {videos.length > 0 ? (
            <div className={styles.carouselDisplay}>
              <div
                className={styles.carouselInner}
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {videos.map((video) => (
                  <div key={video.id} className={styles.videoCard}>
                    <VideoPlayer
                      videoSrc={video.videoSrc}
                      tracks={video.tracks}
                      theme={localStorage.getItem('theme') || 'light'} // Obtener el tema del localStorage
                    />
                    <p className={styles.videoDescription}>{video.description}</p>
                    <button onClick={() => handleRemoveVideo(video.id)} className={styles.removeButton}>
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.carouselControls}>
                <button onClick={handlePrev} className={`${styles.navButton} ${styles.prevButton}`}>&#8249;</button>
                <button onClick={handleNext} className={`${styles.navButton} ${styles.nextButton}`}>&#8250;</button>
              </div>

              <div className={styles.dotsContainer}>
                {videos.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.dot} ${index === activeIndex ? styles.activeDot : ''}`}
                    onClick={() => setActiveIndex(index)}
                  ></button>
                ))}
              </div>
            </div>
          ) : (
            <p className={styles.emptyMessage}>No hay videos en el carrusel. ¡Añade el primero!</p>
          )}
        </>
      )}
    </div>
  );
};

export default VideoCarousel;