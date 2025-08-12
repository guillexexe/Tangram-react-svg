export const fetchVideos = async () => {
    try {
        const response = await fetch('/api/get_videos.php', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        return data.data || [];
    } catch (error) {
        console.error('Error fetching videos:', error);
        throw error;
    }
};

export const uploadVideo = async (formData: FormData) => {
    try {
        const response = await fetch('/api/upload.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Upload failed');
        }

        return data.data;
    } catch (error) {
        console.error('Error uploading video:', error);
        throw error;
    }
};