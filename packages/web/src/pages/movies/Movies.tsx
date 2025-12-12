import { useEffect, useState } from 'react';
import { getMedia, type Media } from '../../services/media';
import MediaCard from '../../components/media/MediaCard';

const Movies = () => {
    const [movies, setMovies] = useState<Media[]>([]);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const allMedia = await getMedia();
                setMovies(allMedia.filter(m => m.type === 'movie' || !m.type)); // Default to movie if type missing
            } catch (err) {
                console.error("Failed to fetch movies", err);
            }
        };
        fetchMovies();
    }, []);

    return (
        <div className="min-h-screen bg-background p-8 pb-32">
            <h1 className="text-4xl font-bold mb-8 text-white">Movies</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {movies.map(movie => (
                    <MediaCard key={movie.id} media={movie} />
                ))}
            </div>
            {movies.length === 0 && (
                <div className="text-center text-white/50 mt-20">No movies found in library.</div>
            )}
        </div>
    );
};

export default Movies;
