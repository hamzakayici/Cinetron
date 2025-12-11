const Library = () => {
    const items = Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        title: `Movie Title ${i + 1}`,
        year: 2023,
        poster: 'https://placehold.co/300x450/1e293b/cbd5e1?text=Poster',
    }));

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Library</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {items.map((item) => (
                    <div key={item.id} className="group relative bg-slate-900 rounded-lg overflow-hidden shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-1">
                        <div className="aspect-[2/3] w-full overflow-hidden">
                            <img
                                src={item.poster}
                                alt={item.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <div className="p-4 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent pt-12 translate-y-2 group-hover:translate-y-0 transition-transform">
                            <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                            <p className="text-slate-400 text-sm">{item.year}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Library;
