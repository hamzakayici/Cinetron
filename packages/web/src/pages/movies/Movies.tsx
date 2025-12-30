import { useEffect, useState, useMemo } from 'react';
import { getMedia, type Media } from '../../services/media';
import MediaCard from '../../components/media/MediaCard';

const Movies = () => {
    const [movies, setMovies] = useState<Media[]>([]);
    const [genres, setGenres] = useState<string[]>([]);
    const [years, setYears] = useState<number[]>([]);
    
    // Filters
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, az, za

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const allMedia = await getMedia();
                const moviesData = allMedia.filter(m => m.type === 'movie' || !m.type);
                setMovies(moviesData);

                // Extract unique genres and years
                const uniqueGenres = Array.from(new Set(moviesData.flatMap(m => m.genres || []))).sort();
                const uniqueYears = Array.from(new Set(moviesData.map(m => m.year).filter(y => y))).sort((a, b) => b! - a!) as number[];
                
                setGenres(uniqueGenres);
                setYears(uniqueYears);
            } catch (err) {
                console.error("Failed to fetch movies", err);
            }
        };
        fetchMovies();
    }, []);

    const filteredMovies = useMemo(() => {
        let result = [...movies];

        // Filter by Genre
        if (selectedGenre) {
            result = result.filter(m => m.genres?.includes(selectedGenre));
        }

        // Filter by Year
        if (selectedYear) {
            result = result.filter(m => m.year === parseInt(selectedYear));
        }

        // Sort
        if (sortOrder === 'newest') {
            result.sort((a, b) => (b.year || 0) - (a.year || 0));
        } else if (sortOrder === 'oldest') {
            result.sort((a, b) => (a.year || 0) - (b.year || 0));
        } else if (sortOrder === 'az') {
            result.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortOrder === 'za') {
            result.sort((a, b) => b.title.localeCompare(a.title));
        }

        return result;
    }, [movies, selectedGenre, selectedYear, sortOrder]);

    return (
        <div className="min-h-screen bg-background p-8 pb-32">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-4xl font-bold text-white">Movies</h1>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Genre Filter */}
                    <select 
                        value={selectedGenre} 
                        onChange={e => setSelectedGenre(e.target.value)}
                        className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                    >
                        <option value="">All Genres</option>
                        {genres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>

                    {/* Year Filter */}
                    <select 
                        value={selectedYear} 
                        onChange={e => setSelectedYear(e.target.value)}
                        className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                    >
                        <option value="">All Years</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    {/* Sort Order */}
                    <select 
                        value={sortOrder} 
                        onChange={e => setSortOrder(e.target.value)}
                        className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="az">A-Z</option>
                        <option value="za">Z-A</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredMovies.map(movie => (
                    <MediaCard key={movie.id} media={movie} />
                ))}
            </div>
            {filteredMovies.length === 0 && (
                <div className="text-center text-white/50 mt-20">No filtered movies found.</div>
            )}
        </div>
    );
};

export default Movies;
