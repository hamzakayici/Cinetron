import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { scanLibrary } from '../../services/media';

const Admin = () => {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<{ message: string, added: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleScan = async () => {
        setScanning(true);
        setResult(null);
        setError(null);
        try {
            const res = await scanLibrary();
            setResult(res);
        } catch (err) {
            setError("Scan failed. Check console or server logs.");
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pt-10">
            <h1 className="text-3xl font-bold mb-8">System Administration</h1>

            {/* Library Management Card */}
            <div className="bg-surface rounded-xl p-6 border border-white/5">
                <h2 className="text-xl font-semibold mb-4">Library Management</h2>
                <p className="text-white/60 mb-6">
                    Scan your media directory (/app/media) for new content. This will parse file names and populate the database.
                </p>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleScan}
                        disabled={scanning}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                        <RefreshCw className={`h-5 w-5 ${scanning ? 'animate-spin' : ''}`} />
                        {scanning ? 'Scanning...' : 'Scan Library'}
                    </button>

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-2 rounded-lg"
                        >
                            <CheckCircle size={18} />
                            <span>{result.message} ({result.added} new items)</span>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-2 rounded-lg"
                        >
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Admin;
