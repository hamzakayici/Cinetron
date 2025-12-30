import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Edit2, Plus, Film, Image as ImageIcon, Subtitles as SubtitlesIcon, X, DownloadCloud } from 'lucide-react';
import { useUploadQueue } from '../../context/UploadQueueContext';
import { getMedia, updateMedia, deleteMedia, getSubtitles, uploadSubtitle, deleteSubtitle, searchMetadata } from '../../services/api';

interface Media {
    id: string;
    title: string;
    type: 'movie' | 'series' | 'tv';
    year?: number;
    overview?: string;
    posterUrl?: string;
    backdropUrl?: string;
    filePath?: string;
}

interface Subtitle {
    id: string;
    language: string;
    label: string;
    url: string;
}

const MediaManagement = () => {
    const [mediaList, setMediaList] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Modals
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSubtitleModal, setShowSubtitleModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    
    // Import Modal State
    const [importQuery, setImportQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Upload Queue
    const { addToQueue } = useUploadQueue();

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        originalTitle: '',
        overview: '',
        releaseDate: '',
        type: 'movie' as 'movie' | 'series' | 'tv',
        posterUrl: '',
        backdropUrl: '',
        tmdbId: ''
    });

    const [files, setFiles] = useState<{
        video: File | null;
        poster: File | null;
        backdrop: File | null;
    }>({
        video: null,
        poster: null,
        backdrop: null
    });

    // Subtitle state
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
    const [subtitleLang, setSubtitleLang] = useState('en');
    const [subtitleLabel, setSubtitleLabel] = useState('English');

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const res = await getMedia();
            setMediaList(res.data);
        } catch (err) {
            console.error('Failed to fetch media', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'poster' | 'backdrop') => {
        const file = e.target.files?.[0];
        if (file) {
            setFiles(prev => ({
                ...prev,
                [type]: file
            }));
        }
    };

    const handleSearchTMDB = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importQuery) return;
        
        setIsSearching(true);
        try {
            // Determine type based on some heuristic or let user choose, defaulting to movie for now
            // Or retrieve both? Let's just search 'movie' and 'tv'
            const res = await searchMetadata(importQuery, 'movie'); 
            // Also search TV? For now simplified to movie search, or add a toggle
            setSearchResults(res.data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleImportSelect = (item: any) => {
        setFormData({
            title: item.title || item.name,
            originalTitle: item.original_title || item.original_name,
            overview: item.overview,
            releaseDate: (item.release_date || item.first_air_date || '').split('-')[0],
            type: item.title ? 'movie' : 'tv', 
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
            tmdbId: item.id
        });
        setShowImportModal(false);
        setShowUploadModal(true);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!files.video) {
            alert("Video file is required");
            return;
        }
        if (!formData.title) {
            alert("Title is required");
            return;
        }

        // Add to Queue
        const queueType = formData.type === 'movie' ? 'movie' : 'show';
        
        addToQueue(
            {
                video: files.video,
                poster: files.poster || undefined,
                backdrop: files.backdrop || undefined
            },
            {
                ...formData,
                type: queueType
            }
        );

        // Reset and Close
        setShowUploadModal(false);
        resetForm();
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMedia) return;

        setIsSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('type', formData.type);
            if (formData.releaseDate) formDataToSend.append('year', formData.releaseDate);
            if (formData.overview) formDataToSend.append('overview', formData.overview);
            
            if (formData.posterUrl) formDataToSend.append('posterUrl', formData.posterUrl);
            if (formData.backdropUrl) formDataToSend.append('backdropUrl', formData.backdropUrl);

            if (files.video) formDataToSend.append('videoFile', files.video);
            if (files.poster) formDataToSend.append('posterFile', files.poster);
            if (files.backdrop) formDataToSend.append('backdropFile', files.backdrop);

            await updateMedia(selectedMedia.id, formDataToSend);
            alert('Media updated successfully!');
            setShowEditModal(false);
            resetForm();
            fetchMedia();
        } catch (err) {
            console.error('Update failed', err);
            alert('Update failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this media?')) return;

        try {
            await deleteMedia(id);
            alert('Media deleted!');
            fetchMedia();
        } catch (err) {
            console.error('Delete failed', err);
            alert('Delete failed');
        }
    };

    const resetForm = () => {
        setFormData({ title: '', originalTitle: '', overview: '', releaseDate: '', type: 'movie', posterUrl: '', backdropUrl: '', tmdbId: '' });
        setFiles({ video: null, poster: null, backdrop: null });
        setSelectedMedia(null);
        setImportQuery('');
        setSearchResults([]);
    };

    const openEditModal = (media: Media) => {
        setSelectedMedia(media);
        setFormData({
            title: media.title,
            originalTitle: '',
            type: media.type,
            releaseDate: media.year?.toString() || '',
            overview: media.overview || '',
            posterUrl: media.posterUrl || '',
            backdropUrl: media.backdropUrl || '',
            tmdbId: ''
        });
        setShowEditModal(true);
    };

    const openSubtitleModal = async (media: Media) => {
        setSelectedMedia(media);
        try {
            const res = await getSubtitles(media.id);
            setSubtitles(res.data);
        } catch (err) {
            console.error('Failed to fetch subtitles', err);
        }
        setShowSubtitleModal(true);
    };

    const handleSubtitleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMedia || !subtitleFile) return;

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('subtitleFile', subtitleFile);
            formDataToSend.append('language', subtitleLang);
            formDataToSend.append('label', subtitleLabel);

            await uploadSubtitle(selectedMedia.id, formDataToSend);
            alert('Subtitle uploaded!');
            setSubtitleFile(null);
            setSubtitleLang('en');
            setSubtitleLabel('English');

            // Refresh subtitles
            const res = await getSubtitles(selectedMedia.id);
            setSubtitles(res.data);
        } catch (err) {
            console.error('Subtitle upload failed', err);
            alert('Subtitle upload failed');
        }
    };

    const handleSubtitleDelete = async (subtitleId: string) => {
        if (!selectedMedia || !confirm('Delete this subtitle?')) return;

        try {
            await deleteSubtitle(selectedMedia.id, subtitleId);
            alert('Subtitle deleted!');
            const res = await getSubtitles(selectedMedia.id);
            setSubtitles(res.data);
        } catch (err) {
            console.error('Subtitle delete failed', err);
            alert('Delete failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Media Management</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <DownloadCloud size={20} />
                        Import from TMDB
                    </button>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus size={20} />
                        Upload Media
                    </button>
                </div>
            </div>

            {/* Media Grid */}
            {loading ? (
                <div className="text-center py-12 text-white/60">Loading...</div>
            ) : mediaList.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                    No media uploaded yet. Click "Upload Media" to get started.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mediaList.map(media => (
                        <motion.div
                            key={media.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-colors group"
                        >
                            {/* Poster */}
                            <div className="aspect-[2/3] bg-black/50 relative overflow-hidden">
                                {media.posterUrl ? (
                                    <img src={media.posterUrl} alt={media.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20">
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                                {/* Overlay actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => openEditModal(media)}
                                        className="p-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => openSubtitleModal(media)}
                                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                        title="Manage Subtitles"
                                    >
                                        <SubtitlesIcon size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(media.id)}
                                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-bold text-lg mb-1 truncate">{media.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-white/60">
                                    <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded text-xs font-bold uppercase">
                                        {media.type}
                                    </span>
                                    {media.year && <span>{media.year}</span>}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Import Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <Modal onClose={() => setShowImportModal(false)} title="Import from TMDB">
                        <div className="space-y-4">
                            <form onSubmit={handleSearchTMDB} className="flex gap-2">
                                <input
                                    type="text"
                                    value={importQuery}
                                    onChange={e => setImportQuery(e.target.value)}
                                    placeholder="Search movies..."
                                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-bold"
                                >
                                    {isSearching ? 'Searching...' : 'Search'}
                                </button>
                            </form>

                            <div className="max-h-[400px] overflow-y-auto space-y-2">
                                {searchResults.map((item: any) => (
                                    <div key={item.id} className="flex gap-4 p-3 bg-black/30 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => handleImportSelect(item)}>
                                        <div className="w-16 h-24 bg-black/50 flex-shrink-0">
                                            {item.poster_path && (
                                                <img src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} alt={item.title} className="w-full h-full object-cover rounded" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold">{item.title || item.name}</h4>
                                            <div className="text-sm text-white/60 mb-1">
                                                {(item.release_date || item.first_air_date || '').split('-')[0]}
                                            </div>
                                            <p className="text-sm text-white/40 line-clamp-2">{item.overview}</p>
                                        </div>
                                    </div>
                                ))}
                                {searchResults.length === 0 && !isSearching && importQuery && (
                                    <div className="text-center text-white/40 py-8">No results found</div>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <Modal onClose={() => { setShowUploadModal(false); resetForm(); }} title="Upload New Media">
                        <form onSubmit={handleUpload} className="space-y-4">
                            {/* Preview Selected TMDB Info */}
                            {formData.posterUrl && (
                                <div className="flex items-center gap-4 p-4 bg-primary-900/20 border border-primary-500/30 rounded-lg mb-4">
                                     <div className="w-12 h-16 bg-black/50 flex-shrink-0">
                                        <img src={formData.posterUrl} alt="Preview" className="w-full h-full object-cover rounded" />
                                     </div>
                                     <div>
                                         <p className="font-medium text-primary-200">Metadata imported from TMDB</p>
                                         <p className="text-sm text-white/40">Poster and backdrop will be used unless you upload custom files.</p>
                                     </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">Title *</label>
                                <input
                                    type="text" required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none text-white"
                                    >
                                        <option value="movie">Movie</option>
                                        <option value="series">Series</option>
                                        <option value="tv">TV</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Year</label>
                                    <input
                                        type="number"
                                        value={formData.releaseDate}
                                        onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">Overview</label>
                                <textarea
                                    rows={3}
                                    value={formData.overview}
                                    onChange={e => setFormData({ ...formData, overview: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none resize-none"
                                />
                            </div>

                            <FileInput label="Video File" icon={Film} accept="video/*" onChange={e => handleFileChange(e, 'video')} file={files.video} />
                            <FileInput label="Poster Image" icon={ImageIcon} accept="image/*" onChange={e => handleFileChange(e, 'poster')} file={files.poster} />
                            <FileInput label="Backdrop Image" icon={ImageIcon} accept="image/*" onChange={e => handleFileChange(e, 'backdrop')} file={files.backdrop} />

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary-600 hover:bg-primary-700 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Upload size={20} />
                                    Add to Queue
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <Modal onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Media">
                        <form onSubmit={handleEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">Title *</label>
                                <input
                                    type="text" required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none text-white"
                                    >
                                        <option value="movie">Movie</option>
                                        <option value="series">Series</option>
                                        <option value="tv">TV</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">Year</label>
                                    <input
                                        type="number"
                                        value={formData.releaseDate}
                                        onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">Overview</label>
                                <textarea
                                    rows={3}
                                    value={formData.overview}
                                    onChange={e => setFormData({ ...formData, overview: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none resize-none"
                                />
                            </div>

                            <p className="text-sm text-white/40">Leave file inputs empty to keep existing files</p>
                            <FileInput label="Video File" icon={Film} accept="video/*" onChange={e => handleFileChange(e, 'video')} file={files.video} />
                            <FileInput label="Poster Image" icon={ImageIcon} accept="image/*" onChange={e => handleFileChange(e, 'poster')} file={files.poster} />
                            <FileInput label="Backdrop Image" icon={ImageIcon} accept="image/*" onChange={e => handleFileChange(e, 'backdrop')} file={files.backdrop} />

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); resetForm(); }}
                                    className="flex-1 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 py-2 rounded-lg font-bold transition-colors"
                                >
                                    {isSubmitting ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Subtitle Modal */}
            <AnimatePresence>
                {showSubtitleModal && selectedMedia && (
                    <Modal onClose={() => setShowSubtitleModal(false)} title={`Subtitles - ${selectedMedia.title}`}>
                        <div className="space-y-4">
                             {/* Upload Subtitle */}
                            <form onSubmit={handleSubtitleUpload} className="space-y-3 pb-4 border-b border-white/10">
                                <h3 className="font-semibold">Upload New Subtitle</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-white/60 mb-1">Language</label>
                                        <select
                                            value={subtitleLang}
                                            onChange={e => setSubtitleLang(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 focus:border-primary-500 outline-none text-white text-sm"
                                        >
                                            <option value="en">en</option>
                                            <option value="tr">tr</option>
                                            <option value="es">es</option>
                                            <option value="fr">fr</option>
                                            <option value="de">de</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/60 mb-1">Label</label>
                                        <input
                                            type="text"
                                            value={subtitleLabel}
                                            onChange={e => setSubtitleLabel(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 focus:border-primary-500 outline-none text-sm"
                                            placeholder="e.g., English"
                                        />
                                    </div>
                                </div>
                                <FileInput
                                    label="Subtitle File (.srt, .vtt)"
                                    icon={SubtitlesIcon}
                                    accept=".srt,.vtt"
                                    onChange={e => setSubtitleFile(e.target.files?.[0] || null)}
                                    file={subtitleFile}
                                />
                                <button
                                    type="submit"
                                    disabled={!subtitleFile}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg font-medium transition-colors"
                                >
                                    Upload Subtitle
                                </button>
                            </form>

                            {/* Subtitle List */}
                            <div>
                                <h3 className="font-semibold mb-3">Existing Subtitles</h3>
                                {subtitles.length === 0 ? (
                                    <p className="text-white/40 text-sm text-center py-4">No subtitles uploaded yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {subtitles.map(sub => (
                                            <div key={sub.id} className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-3 border border-white/10">
                                                <div>
                                                    <div className="font-medium">{sub.label}</div>
                                                    <div className="text-sm text-white/40">{sub.language}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleSubtitleDelete(sub.id)}
                                                    className="p-2 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper Components
const Modal = ({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
    >
        <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-white/10 rounded-2xl p-8 max-w-2xl w-full my-8"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{title}</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X size={24} />
                </button>
            </div>
            {children}
        </motion.div>
    </motion.div>
);

const FileInput = ({ label, icon: Icon, accept, onChange, file }: {
    label: string;
    icon: any;
    accept: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    file: File | null;
}) => (
    <div>
        <label className="block text-sm font-medium text-white/60 mb-1">{label}</label>
        <label className="flex items-center gap-3 bg-black/50 border border-white/10 rounded-lg px-4 py-3 cursor-pointer hover:border-primary-500 transition-colors">
            <Icon size={20} className="text-white/60" />
            <span className="flex-1 text-sm">{file ? file.name : 'Choose file...'}</span>
            <Upload size={16} className="text-white/40" />
            <input type="file" accept={accept} onChange={onChange} className="hidden" />
        </label>
    </div>
);

export default MediaManagement;
