import { useState } from 'react';
import { useUploadQueue } from '../../context/UploadQueueContext';
import { ChevronUp, ChevronDown, RefreshCw, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UploadManager = () => {
    const { queue, removeFromQueue, retryUpload, clearCompleted } = useUploadQueue();
    const [isExpanded, setIsExpanded] = useState(true);

    if (queue.length === 0) return null;

    const activeUploads = queue.filter(item => item.status === 'uploading' || item.status === 'pending');
    const completedUploads = queue.filter(item => item.status === 'completed');
    const errorUploads = queue.filter(item => item.status === 'error');

    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm">
            <motion.div 
                layout
                className="bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div 
                    className="bg-gray-800 p-3 flex items-center justify-between cursor-pointer border-b border-white/5"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        {activeUploads.length > 0 ? (
                            <RefreshCw className="text-blue-400 animate-spin" size={18} />
                        ) : errorUploads.length > 0 ? (
                            <AlertCircle className="text-red-400" size={18} />
                        ) : (
                            <CheckCircle className="text-green-400" size={18} />
                        )}
                        <span className="font-semibold text-white text-sm">
                            {activeUploads.length > 0 
                                ? `Yükleniyor (${activeUploads.length})` 
                                : `Tamamlandı (${completedUploads.length})`}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {completedUploads.length > 0 && isExpanded && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); clearCompleted(); }}
                                className="text-xs text-white/40 hover:text-white px-2 py-1 rounded hover:bg-white/10 mr-2"
                            >
                                Temizle
                            </button>
                        )}
                        {isExpanded ? <ChevronDown size={18} className="text-white/60" /> : <ChevronUp size={18} className="text-white/60" />}
                    </div>
                </div>

                {/* Body */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="max-h-80 overflow-y-auto"
                        >
                            <div className="divide-y divide-white/5">
                                {queue.map((item) => (
                                    <div key={item.id} className="p-3 bg-gray-900/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="overflow-hidden pr-2">
                                                <div className="text-sm text-white font-medium truncate">{item.metadata.title}</div>
                                                <div className="text-xs text-white/40 flex items-center gap-1">
                                                    {item.status === 'uploading' && <span className="text-blue-400">Yükleniyor... {item.progress}%</span>}
                                                    {item.status === 'pending' && <span className="text-white/40">Sırada</span>}
                                                    {item.status === 'completed' && <span className="text-green-400">Tamamlandı</span>}
                                                    {item.status === 'error' && <span className="text-red-400">Hata: {item.errorMessage}</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {item.status === 'error' && (
                                                    <button onClick={() => retryUpload(item.id)} className="p-1 hover:bg-white/10 rounded text-blue-400">
                                                        <RefreshCw size={14} />
                                                    </button>
                                                )}
                                                {(item.status === 'pending' || item.status === 'error' || item.status === 'completed') && (
                                                    <button onClick={() => removeFromQueue(item.id)} className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-red-400">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        {(item.status === 'uploading' || item.status === 'pending') && (
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-2">
                                                <motion.div 
                                                    className="h-full bg-blue-500"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.progress}%` }}
                                                    transition={{ duration: 0.2 }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default UploadManager;
