// src/components/VideoThumbnail.tsx

import React from 'react';
import styles from './VideoCarousel.module.css';

interface VideoThumbnailProps {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    duration: string;
  };
  onClick: () => void;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ video, onClick }) => {
  return (
    <article className={styles.thumbnailCard} onClick={onClick}>
      <div className={styles.thumbnailWrapper}>
        <img
          src={video.thumbnail}
          alt={`Miniatura de ${video.title}`}
          className={styles.thumbnailImage}
          loading="lazy"
        />
        <span className={styles.durationBadge}>{video.duration}</span>
        <div className={styles.playIcon}>
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
          </svg>
        </div>
      </div>
      <h3 className={styles.videoTitle}>{video.title}</h3>
    </article>
  );
};

export default VideoThumbnail;