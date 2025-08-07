// src/services/videoService.js

export const fetchVideos = async () => {
    try {
        const response = await fetch('http://localhost/mi-proyecto-backend/get_videos.php');
        if (!response.ok) {
            throw new Error('Error al obtener videos desde el servidor');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching videos:", error);
        throw error;
    }
};