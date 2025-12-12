import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getMedia, type Media } from '../../services/media';
import MediaCard from '../../components/media/MediaCard';

const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [allMedia, setAllMedia] = useState<Media[]>([]);
    const [results, setResults] = useState<Media[]>([]);

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const media = await getMedia();
                setAllMedia(media);
            } catch (err) {
                console.error("Failed to fetch media for search", err);
            }
        };
        fetchMedia();
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const q = query.toLowerCase();
        const filtered = allMedia.filter(m =>
            m.title.toLowerCase().includes(q) ||
            (m.overview && m.overview.toLowerCase().includes(q))
        );
        setResults(filtered);
    }, [query, allMedia]);

    return (
        <div className="min-h-screen bg-background p-8 pb-32">
            <div className="max-w-4xl mx-auto">
                <div className="relative mb-12 mt-8">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="text-white/50" size={24} />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for movies, series..."
                        className="w-full bg-surface/50 border border-white/10 rounded-full py-4 pl-14 pr-6 text-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-surface transition-all"
                        autoFocus
                    />
                </div>

                {query && (
                    <div className="mb-4 text-white/50">
                        Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {results.map(item => (
                        <MediaCard key={item.id} media={item} />
                    ))}
                </div>

                {!query && (
                    <div className="text-center text-white/30 mt-20">
                        <Search className="mx-auto mb-4 opacity-50" size={48} />
                        <p className="text-xl">Type to start searching</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
