import { useEffect, useState } from 'react';
import { getMedia, type Media } from '../../services/media';
import MediaCard from '../../components/media/MediaCard';

const Series = () => {
    const [series, setSeries] = useState<Media[]>([]);

    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const allMedia = await getMedia();
                setSeries(allMedia.filter(m => m.type === 'series'));
            } catch (err) {
                console.error("Failed to fetch series", err);
            }
        };
        fetchSeries();
    }, []);

    return (
        <div className="min-h-screen bg-background p-8 pb-32">
            <h1 className="text-4xl font-bold mb-8 text-white">TV Series</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {series.map(item => (
                    <MediaCard key={item.id} media={item} />
                ))}
            </div>
            {series.length === 0 && (
                <div className="text-center text-white/50 mt-20">No series found in library.</div>
            )}
        </div>
    );
};

export default Series;
