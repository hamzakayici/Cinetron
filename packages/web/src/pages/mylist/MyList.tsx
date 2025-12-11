import { useNavigate } from 'react-router-dom';
import { List } from 'lucide-react';

const MyList = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto text-center mt-20">
                <div className="w-24 h-24 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <List size={48} className="text-primary-400" />
                </div>
                <h1 className="text-5xl font-black mb-4 text-white">My List</h1>
                <p className="text-xl text-white/60 mb-8">
                    Personal list feature coming soon. Bookmark your favorite content.
                </p>
                <button
                    onClick={() => navigate('/library')}
                    className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition"
                >
                    Go to Library
                </button>
            </div>
        </div>
    );
};

export default MyList;
