// src/components/VideoPlayer.tsx
import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  videoSrc: string;
  tracks: {
    src: string;
    kind: 'subtitles' | 'audio';
    label: string;
    srclang?: string;
  }[];
  theme: string; // 'light' or 'dark'
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoSrc, tracks, theme }) => {
  const videoNode = useRef<HTMLVideoElement>(null);
  const player = useRef<any>(null);

  useEffect(() => {
    if (videoNode.current) {
      player.current = videojs(videoNode.current, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{ src: videoSrc, type: 'video/mp4' }],
      });

      // Añadir las pistas de subtítulos y audio
      tracks.forEach(track => {
        const trackElement = player.current?.addRemoteTextTrack(track);
        if (track.kind === 'subtitles') {
          // No necesitamos hacer nada extra, video.js lo maneja bien
        } else if (track.kind === 'audio') {
          // La API de video.js puede manejar pistas de audio separadas
        }
      });
    }

    return () => {
      if (player.current) {
        player.current.dispose();
      }
    };
  }, [videoSrc, tracks]);

  useEffect(() => {
    if (player.current) {
      // Aplicar el tema basado en la propiedad del componente
      const playerElement = player.current.el();
      if (theme === 'dark') {
        playerElement.classList.remove('vjs-theme-light');
        playerElement.classList.add('vjs-theme-dark');
      } else {
        playerElement.classList.remove('vjs-theme-dark');
        playerElement.classList.add('vjs-theme-light');
      }
    }
  }, [theme]);

  return (
    <div data-vjs-player>
      <video ref={videoNode} className="video-js vjs-big-play-centered" />
    </div>
  );
};

export default VideoPlayer;