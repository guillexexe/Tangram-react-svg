import React from 'react';
import styles from './VideoCarousel.module.css';

interface VideoThumbnailProps {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    videoUrl: string;
    duration: string;
  };
  onClick: () => void;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ video, onClick }) => {
  return (
    <div className={styles.thumbnailCard} onClick={onClick}>
      <div className={styles.thumbnailWrapper}>
        <div className={styles.thumbnailImageContainer}>
          {video.thumbnail ? (
            <img 
              src={video.thumbnail} 
              alt={`Miniatura de ${video.title}`} 
              className={styles.thumbnailImage}
            />
          ) : (
            <video 
              preload="metadata" 
              className={styles.thumbnailVideo}
              src={`${video.videoUrl}#t=1`} // Mostrar el primer segundo como miniatura
              muted
              playsInline
            />
          )}
        </div>
        <div className={styles.videoDuration}>{video.duration}</div>
        <div className={styles.playButton}>
          <span>▶</span>
        </div>
      </div>
      <div className={styles.videoTitle}>{video.title}</div>
    </div>
  );
};

export default VideoThumbnail;