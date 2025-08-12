import React, { useState, useEffect, useRef } from 'react';
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
    videoUrl: string;
    thumbnail: string;
    duration: string;
    description: string;
    audioTracks: { src: string; label: string }[];
    subtitleTracks: { src: string; label: string; srclang: string }[];
}

interface VideoDetails {
    title: string;
    videoUrl: string;
    description?: string;
    format: string;
    dimensions: string;
    duration: string;
    size: string;
}

const VideoCarousel: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState<'carousel' | 'uploader'>('carousel');

    const videoRef = useRef<HTMLVideoElement>(null);

    const loadVideos = async () => {
        setLoading(true);
        try {
            const data = await fetchVideos();
            // Transformar URLs para usar el proxy
            const transformedVideos = data.map(video => ({
                ...video,
                videoUrl: video.videoUrl.replace('http://localhost/mi-proyecto-backend', '/api'),
                audioTracks: video.audioTracks?.map(track => ({
                    ...track,
                    src: track.src.replace('http://localhost/mi-proyecto-backend', '/api')
                })) || [],
                subtitleTracks: video.subtitleTracks?.map(track => ({
                    ...track,
                    src: track.src.replace('http://localhost/mi-proyecto-backend', '/api')
                })) || []
            }));
            setVideos(transformedVideos);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar videos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'carousel') {
            loadVideos();
        }
    }, [view]);

    const formatDuration = (seconds: number) => {
        if (isNaN(seconds) || !isFinite(seconds)) return 'N/A';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return [h, m, s]
            .map(v => v < 10 ? "0" + v : v)
            .filter((v, i) => v !== "00" || i > 0)
            .join(":");
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const handleVideoClick = async (video: Video) => {
        setSelectedVideo(video);

        const newVideoDetails: VideoDetails = {
            title: video.title,
            videoUrl: video.videoUrl,
            description: video.description,
            format: 'N/A',
            dimensions: 'N/A',
            duration: 'N/A',
            size: 'N/A',
        };

        if (video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be')) {
            newVideoDetails.format = 'YouTube';
        } else {
            const tempVideo = document.createElement('video');
            tempVideo.src = video.videoUrl;
            tempVideo.crossOrigin = 'anonymous';
            
            await new Promise((resolve) => {
                tempVideo.onloadedmetadata = () => {
                    newVideoDetails.format = video.videoUrl.split('.').pop()?.toUpperCase() || 'N/A';
                    newVideoDetails.dimensions = `${tempVideo.videoWidth}x${tempVideo.videoHeight}`;
                    newVideoDetails.duration = formatDuration(tempVideo.duration);
                    resolve(null);
                };
                tempVideo.onerror = resolve;
            });

            try {
                const response = await fetch(video.videoUrl, { method: 'HEAD' });
                const size = response.headers.get('content-length');
                if (size) {
                    newVideoDetails.size = formatBytes(Number(size));
                }
            } catch (error) {
                console.error('Error al obtener el tamaño del archivo:', error);
            }
        }
        
        setVideoDetails(newVideoDetails);
    };

    const handleCloseModal = () => {
        setSelectedVideo(null);
        setVideoDetails(null);
    };

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        arrows: true,
        responsive: [
            { breakpoint: 1024, settings: { slidesToShow: 2 } },
            { breakpoint: 600, settings: { slidesToShow: 1 } },
        ],
    };

    if (loading) return <div className={styles.loading}>Cargando videos...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <section className={styles.carouselContainer}>
            {view === 'uploader' ? (
                <VideoUploader onUploadSuccess={() => {
                    setView('carousel');
                    loadVideos();
                }} onCancel={() => setView('carousel')} />
            ) : (
                <>
                    <h2 className={styles.title}>Nuestros Videos</h2>
                    <div className={styles.carouselWrapper}>
                        <Slider {...settings}>
                            {videos.map(video => (
                                <div key={video.id}>
                                    <VideoThumbnail video={video} onClick={() => handleVideoClick(video)} />
                                </div>
                            ))}
                        </Slider>
                    </div>
                    <div className={styles.controls}>
                        <button onClick={() => setView('uploader')} className={styles.addButton}>
                            Añadir Video
                        </button>
                    </div>
                    {selectedVideo && videoDetails && (
                        <VideoModal 
                            video={selectedVideo} 
                            videoDetails={videoDetails} 
                            onClose={handleCloseModal} 
                        />
                    )}
                </>
            )}
        </section>
    );
};

export default VideoCarousel;