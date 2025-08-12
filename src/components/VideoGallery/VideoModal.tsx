import React, { useRef, useEffect, useState } from 'react';
import styles from './VideoCarousel.module.css';

interface VideoModalProps {
    video: {
        id: string;
        videoUrl: string;
        title: string;
        description?: string;
        audioTracks: { src: string; label: string }[];
        subtitleTracks: { src: string; label: string; srclang: string }[];
    };
    videoDetails: {
        title: string;
        videoUrl: string;
        description?: string;
        format: string;
        dimensions: string;
        duration: string;
        size: string;
    };
    onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ video, videoDetails, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [selectedAudioTrack, setSelectedAudioTrack] = useState(0);
    const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState(-1);
    const [isYouTubeVideo] = useState(() => 
        video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be')
    );

    // Manejar cambio de pista de audio
    const handleAudioTrackChange = (index: number) => {
        setSelectedAudioTrack(index);
        if (videoRef.current) {
            // Solución alternativa para navegadores que no soportan audioTracks API
            const sources = Array.from(videoRef.current.getElementsByTagName('source'));
            sources.forEach(source => {
                if (source.type.includes('audio/')) {
                    videoRef.current?.removeChild(source);
                }
            });

            if (video.audioTracks[index]) {
                const audioSource = document.createElement('source');
                audioSource.src = video.audioTracks[index].src;
                audioSource.type = 'audio/mpeg';
                videoRef.current.appendChild(audioSource);
                videoRef.current.load();
                videoRef.current.play().catch(e => console.error("Error al reproducir:", e));
            }
        }
    };

    // Manejar cambio de subtítulos
    const handleSubtitleTrackChange = (index: number) => {
        setSelectedSubtitleTrack(index);
        if (videoRef.current?.textTracks) {
            for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                videoRef.current.textTracks[i].mode = i === index ? 'showing' : 'hidden';
            }
        }
    };

    // Configurar el video cuando se monta el componente
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || isYouTubeVideo) return;

        const handleLoadedMetadata = () => {
            // Configurar subtítulos
            if (videoElement.textTracks) {
                for (let i = 0; i < videoElement.textTracks.length; i++) {
                    videoElement.textTracks[i].mode = 
                        (i === selectedSubtitleTrack) ? 'showing' : 'hidden';
                }
            }
        };

        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [selectedSubtitleTrack, isYouTubeVideo]);

    // Manejar tecla Escape para cerrar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const getMimeType = (url: string) => {
        const extension = url.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'mp4': return 'video/mp4';
            case 'webm': return 'video/webm';
            case 'ogg': return 'video/ogg';
            case 'mp3': return 'audio/mpeg';
            case 'vtt': return 'text/vtt';
            default: return 'video/mp4';
        }
    };

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

                <h3 className={styles.modalTitle}>{videoDetails.title}</h3>

                <div className={styles.videoWrapper}>
                    {isYouTubeVideo ? (
                        <iframe
                            src={video.videoUrl}
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={videoDetails.title}
                        ></iframe>
                    ) : (
                        <>
                            <video
                                key={video.id}
                                ref={videoRef}
                                controls
                                autoPlay
                                className={styles.videoPlayer}
                                playsInline
                                crossOrigin="anonymous"
                            >
                                <source src={video.videoUrl} type={getMimeType(video.videoUrl)} />
                                
                                {/* Subtítulos */}
                                {video.subtitleTracks?.map((track, index) => (
                                    <track
                                        key={`sub-${index}`}
                                        kind="subtitles"
                                        src={track.src}
                                        srcLang={track.srclang}
                                        label={track.label}
                                        default={index === selectedSubtitleTrack}
                                    />
                                ))}
                                
                                {/* Pista de audio seleccionada */}
                                {video.audioTracks[selectedAudioTrack] && (
                                    <source 
                                        key={`audio-${selectedAudioTrack}`}
                                        src={video.audioTracks[selectedAudioTrack].src}
                                        type={getMimeType(video.audioTracks[selectedAudioTrack].src)}
                                    />
                                )}
                            </video>

                            {/* Controles personalizados para pistas de audio */}
                            {video.audioTracks?.length > 1 && (
                                <div className={styles.audioTrackSelector}>
                                    <label>Pista de audio:</label>
                                    <select
                                        value={selectedAudioTrack}
                                        onChange={(e) => handleAudioTrackChange(Number(e.target.value))}
                                        aria-label="Seleccionar pista de audio"
                                    >
                                        {video.audioTracks.map((track, index) => (
                                            <option key={index} value={index}>
                                                {track.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Controles personalizados para subtítulos */}
                            {video.subtitleTracks?.length > 0 && (
                                <div className={styles.subtitleSelector}>
                                    <label>Subtítulos:</label>
                                    <select
                                        value={selectedSubtitleTrack}
                                        onChange={(e) => handleSubtitleTrackChange(Number(e.target.value))}
                                        aria-label="Seleccionar subtítulos"
                                    >
                                        <option value={-1}>Desactivados</option>
                                        {video.subtitleTracks.map((track, index) => (
                                            <option key={index} value={index}>
                                                {track.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Sección de detalles del video */}
                <div className={styles.videoDetails}>
                    <h4>Detalles del video:</h4>
                    <div className={styles.detailsGrid}>
                        <div>
                            <p><strong>Formato:</strong> <span>{videoDetails.format}</span></p>
                            <p><strong>Dimensiones:</strong> <span>{videoDetails.dimensions}</span></p>
                        </div>
                        <div>
                            <p><strong>Duración:</strong> <span>{videoDetails.duration}</span></p>
                            <p><strong>Tamaño:</strong> <span>{videoDetails.size}</span></p>
                        </div>
                    </div>
                    {videoDetails.description && (
                        <div className={styles.descriptionContainer}>
                            <p><strong>Descripción:</strong></p>
                            <p className={styles.descriptionText}>{videoDetails.description}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoModal;