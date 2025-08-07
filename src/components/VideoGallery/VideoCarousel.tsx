// src/components/VideoCarousel.tsx

import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import VideoThumbnail from './VideoThumbnail';
import VideoModal from './VideoModal';
import VideoUploader from './VideoUploader';
import { fetchVideos } from '../../services/videoService';
import styles from './VideoCarousel.module.css';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
}

const VideoCarousel: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'carousel' | 'uploader'>('carousel');

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const data = await fetchVideos();
        setVideos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar videos');
      } finally {
        setLoading(false);
      }
    };
    if (view === 'carousel') {
      loadVideos();
    }
  }, [view]);

  if (loading) return <div className={styles.loading}>Cargando videos...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  // Configuración de react-slick
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 3,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 1,
        },
      },
    ],
  };

  return (
    <section className={styles.carouselContainer}>
      {view === 'uploader' ? (
        <VideoUploader
          onUploadSuccess={() => setView('carousel')}
          onCancel={() => setView('carousel')}
        />
      ) : (
        <>
          <h2 className={styles.title}>Nuestros Videos</h2>
          <div className={styles.carouselWrapper}>
            <Slider {...settings}>
              {videos.map(video => (
                <div key={video.id}>
                  <VideoThumbnail
                    video={video}
                    onClick={() => setSelectedVideo(video)}
                  />
                </div>
              ))}
            </Slider>
          </div>
          <div className={styles.controls}>
            <button onClick={() => setView('uploader')} className={styles.addButton}>
              Añadir Video
            </button>
          </div>
          {selectedVideo && (
            <VideoModal
              video={selectedVideo}
              onClose={() => setSelectedVideo(null)}
            />
          )}
        </>
      )}
    </section>
  );
};

export default VideoCarousel;