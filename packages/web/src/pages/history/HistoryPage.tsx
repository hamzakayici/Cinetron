import { useEffect, useState } from 'react';
import { getHistory } from '../../services/api';
import { type Media } from '../../services/media';
import MediaCard from '../../components/media/MediaCard';

const HistoryPage = () => {
    const [history, setHistory] = useState<Media[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await getHistory();
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="min-h-screen bg-background p-8 pb-32">
            <h1 className="text-4xl font-bold mb-8 text-white">Watch History</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {history.map(item => (
                    <MediaCard key={item.id} media={item} />
                ))}
            </div>
            {history.length === 0 && (
                <div className="text-center text-white/50 mt-20">You haven't watched anything yet.</div>
            )}
        </div>
    );
};

export default HistoryPage;
