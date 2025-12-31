import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFavorites } from '../../services/api';
import { type Media } from '../../services/media';
import MediaCard from '../../components/media/MediaCard';

const MyList = () => {
    const { t } = useTranslation();
    const [favorites, setFavorites] = useState<Media[]>([]);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const res = await getFavorites();
                setFavorites(res.data);
            } catch (err) {
                console.error("Failed to fetch favorites", err);
            }
        };
        fetchFavorites();
    }, []);

    return (
        <div className="min-h-screen bg-background p-8 pb-32">
            <div className="relative z-10 mb-8 bg-background/95 backdrop-blur-sm rounded-xl p-6">
                <h1 className="text-4xl font-bold text-white">{t('sidebar.mylist')}</h1>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {favorites.map(item => (
                    <MediaCard key={item.id} media={item} />
                ))}
            </div>
            {favorites.length === 0 && (
                <div className="text-center text-white/50 mt-20">{t('mylist.empty')}</div>
            )}
        </div>
    );
};

export default MyList;
