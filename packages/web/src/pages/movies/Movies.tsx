import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getMedia, type Media } from '../../services/media';
import MediaCard from '../../components/media/MediaCard';

const Movies = () => {
    const { t } = useTranslation();
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
                <h1 className="text-4xl font-bold text-white">{t('sidebar.movies')}</h1>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Genre Filter */}
                    <select 
                        value={selectedGenre} 
                        onChange={e => setSelectedGenre(e.target.value)}
                        className="bg-white/20 text-white border border-white/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 hover:bg-white/25 transition-colors font-medium"
                    >
                        <option value="" className="bg-surface text-white">{t('movies.allGenres')}</option>
                        {genres.map(g => <option key={g} value={g} className="bg-surface text-white">{g}</option>)}
                    </select>

                    {/* Year Filter */}
                    <select 
                        value={selectedYear} 
                        onChange={e => setSelectedYear(e.target.value)}
                        className="bg-white/20 text-white border border-white/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 hover:bg-white/25 transition-colors font-medium"
                    >
                        <option value="" className="bg-surface text-white">{t('movies.allYears')}</option>
                        {years.map(y => <option key={y} value={y} className="bg-surface text-white">{y}</option>)}
                    </select>

                    {/* Sort Order */}
                    <select 
                        value={sortOrder} 
                        onChange={e => setSortOrder(e.target.value)}
                        className="bg-white/20 text-white border border-white/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 hover:bg-white/25 transition-colors font-medium"
                    >
                        <option value="newest" className="bg-surface text-white">{t('movies.newestFirst')}</option>
                        <option value="oldest" className="bg-surface text-white">{t('movies.oldestFirst')}</option>
                        <option value="az" className="bg-surface text-white">A-Z</option>
                        <option value="za" className="bg-surface text-white">Z-A</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredMovies.map(movie => (
                    <MediaCard key={movie.id} media={movie} />
                ))}
            </div>
            {filteredMovies.length === 0 && (
                <div className="text-center text-white/50 mt-20">{t('movies.noResults')}</div>
            )}
        </div>
    );
};

export default Movies;
