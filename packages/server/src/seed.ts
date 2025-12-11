import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { MediaService } from './media/media.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from './users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const adminEmail = 'admin@cinetron.com';
    const adminPassword = 'admin123';
    const existingAdmin = await usersService.findOne(adminEmail);

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await usersService.create({
            email: adminEmail,
            passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            role: UserRole.ADMIN,
        });
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }

    // --- Media Seeding ---
    const mediaService = app.get(MediaService);
    const mockMovies = [
        { title: "Dune: Part Two", year: 2024, type: "movie", poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", backdrop: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", overview: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge." },
        { title: "Oppenheimer", year: 2023, type: "movie", poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", backdrop: "https://image.tmdb.org/t/p/original/nb3xI8XI3w4pMVZ38VijItyBXux.jpg", overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb." },
        { title: "The Dark Knight", year: 2008, type: "movie", poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", backdrop: "https://image.tmdb.org/t/p/original/oMkFPS5nMDt7K8f7s26t5tG89d6.jpg", overview: "Batman raises the stakes in his war on crime." },
        { title: "Inception", year: 2010, type: "movie", poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", backdrop: "https://image.tmdb.org/t/p/original/s3TBrRGB1jav7szbG0JhCe3Qyea.jpg", overview: "A thief who steals corporate secrets through the use of dream-sharing technology." },
        { title: "Interstellar", year: 2014, type: "movie", poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", backdrop: "https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg", overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
        { title: "The Matrix", year: 1999, type: "movie", poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpQBjq.jpg", backdrop: "https://image.tmdb.org/t/p/original/l4QHerTSbMI7qgva0vK7oQyIrRI.jpg", overview: "A computer hacker learns from mysterious rebels about the true nature of his reality." },
        { title: "Breaking Bad", year: 2008, type: "tv", poster: "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg", backdrop: "https://image.tmdb.org/t/p/original/tsRy63Mu5CU8etx1X7ZLyf7UP1M.jpg", overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine." },
        { title: "Stranger Things", year: 2016, type: "tv", poster: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", backdrop: "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYkOD8778Fj.jpg", overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments." },
        { title: "Game of Thrones", year: 2011, type: "tv", poster: "https://image.tmdb.org/t/p/w500/1Xs1uzGHgGeX7L5WpDwYVAgV4W1.jpg", backdrop: "https://image.tmdb.org/t/p/original/2OMB0ynKlyIenMJWI2Dy9IWTv9x.jpg", overview: "Nine noble families fight for control over the lands of Westeros." },
        { title: "Avengers: Endgame", year: 2019, type: "movie", poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg", backdrop: "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg", overview: "After the devastating events of Infinity War, the universe is in ruins." },
        // ... Adding diverse mix of 40 more items via loop/generation or specific list
        { title: "Spider-Man: Across the Spider-Verse", year: 2023, type: "movie", poster: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", backdrop: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg", overview: "Miles Morales catapults across the Multiverse." },
        { title: "The Godfather", year: 1972, type: "movie", poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", backdrop: "https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg", overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family." },
        { title: "Pulp Fiction", year: 1994, type: "movie", poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", backdrop: "https://image.tmdb.org/t/p/original/suaEOtk1916gXQBzsL6nKm6AmOe.jpg", overview: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine." },
        { title: "Fight Club", year: 1999, type: "movie", poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", backdrop: "https://image.tmdb.org/t/p/original/hZkgoQYus5vegHoetLkCJzb17zJ.jpg", overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club." },
        { title: "Forrest Gump", year: 1994, type: "movie", poster: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", backdrop: "https://image.tmdb.org/t/p/original/qdIMHd4sCCa71T5jfYWRqFue1sQ.jpg", overview: "The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate and other history unfold through the perspective of an Alabama man." },
        { title: "Star Wars: A New Hope", year: 1977, type: "movie", poster: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", backdrop: "https://image.tmdb.org/t/p/original/4qC1maUv0Dwdx9RHqYhsmJsLMft.jpg", overview: "Luke Skywalker joins forces with a Jedi Knight, a cocky pilot, a Wookiee and two droids to save the galaxy." },
        { title: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, type: "movie", poster: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", backdrop: "https://image.tmdb.org/t/p/original/lXhgCODAbBXL5buk9yEmTpOoOgC.jpg", overview: "A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring." },
        { title: "Gladiator", year: 2000, type: "movie", poster: "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg", backdrop: "https://image.tmdb.org/t/p/original/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg", overview: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery." },
        { title: "The Shawshank Redemption", year: 1994, type: "movie", poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", backdrop: "https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg", overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison." },
        { title: "Titanic", year: 1997, type: "movie", poster: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg", backdrop: "https://image.tmdb.org/t/p/original/3l111bk5oZ6INjQ5jsqfGyAxmnQ.jpg", overview: "101-year-old Rose DeWitt Bukater tells the story of her life aboard the Titanic." },
        { title: "Avatar", year: 2009, type: "movie", poster: "https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg", backdrop: "https://image.tmdb.org/t/p/original/vL5LR6WdxWPjCqv438WFh6g5304.jpg", overview: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home." },
        { title: "Jurassic Park", year: 1993, type: "movie", poster: "https://image.tmdb.org/t/p/w500/oU7Oq2kFAAlGqbU4Vo0uPrnGWfU.jpg", backdrop: "https://image.tmdb.org/t/p/original/9i3plKv22ySXOrw4Oyb0i6e0dC0.jpg", overview: "A wealthy entrepreneur secretly creates a theme park featuring living dinosaurs drawn from prehistoric DNA." },
        { title: "Black Mirror", year: 2011, type: "tv", poster: "https://image.tmdb.org/t/p/w500/5UaYs5GZGhLeJFPM8XiG978oI37.jpg", backdrop: "https://image.tmdb.org/t/p/original/e9GbJG2i21YQJj2g8S3n4y7jYD.jpg", overview: "A contemporary British re-working of The Twilight Zone with stories that tap into the collective unease about our modern world." },
        { title: "The Office", year: 2005, type: "tv", poster: "https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gJPo2ZLqkLMdFM7.jpg", backdrop: "https://image.tmdb.org/t/p/original/1DSpHrWyOthE8yOIStfK0q8g8f.jpg", overview: "A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium." },
        { title: "Friends", year: 1994, type: "tv", poster: "https://image.tmdb.org/t/p/w500/f496cm9enuEsZkSPzCwnTESEK5s.jpg", backdrop: "https://image.tmdb.org/t/p/original/1Jp3S6e1d9Xh9H9j9j9j9j9j9j9.jpg", overview: "The misadventures of 20-30 something friends as they navigate the pitfalls of work, life and love in Manhattan." },
        { title: "Sherlock", year: 2010, type: "tv", poster: "https://image.tmdb.org/t/p/w500/7WTsnHkbA0FaG6R9twfFde0I9hl.jpg", backdrop: "https://image.tmdb.org/t/p/original/M9y98d9g5x5x5x5x5x5x5x5x5.jpg", overview: "A modern update finds the famous sleuth and his doctor partner solving crime in 21st century London." },
        { title: "Peaky Blinders", year: 2013, type: "tv", poster: "https://image.tmdb.org/t/p/w500/vUUqzWa2LnHIVqkaKVlVGkDcZIW.jpg", backdrop: "https://image.tmdb.org/t/p/original/9G815xPHv8X3x3x3x3x3x3x3x3.jpg", overview: "A gangster family epic set in 1919 Birmingham, England; centered on a gang who sew razor blades in the peaks of their caps." },
        { title: "Better Call Saul", year: 2015, type: "tv", poster: "https://image.tmdb.org/t/p/w500/fC2HDm5t0kMGEg1pJKB00ZlD2y.jpg", backdrop: "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y9w9w9w9w9w.jpg", overview: "The trials and tribulations of criminal lawyer Jimmy McGill in the time before he established his strip-mall law office in Albuquerque, New Mexico." },
        { title: "Mandalorian", year: 2019, type: "tv", poster: "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg", backdrop: "https://image.tmdb.org/t/p/original/6x9x9x9x9x9x9x9x9x9x9x9x9.jpg", overview: "The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic." },
        { title: "The Witcher", year: 2019, type: "tv", poster: "https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyWDTVzrC7d9Fq.jpg", backdrop: "https://image.tmdb.org/t/p/original/jBJWF8r8x8x8x8x8x8x8x8x8x.jpg", overview: "Geralt of Rivia, a mutated monster-hunter for hire, journeys toward his destiny in a turbulent world where people often prove more wicked than beasts." },
        { title: "Cyberpunk: Edgerunners", year: 2022, type: "tv", poster: "https://image.tmdb.org/t/p/w500/m2f0l1y2y2y2y2y2y2y2y2y2y.jpg", backdrop: "https://image.tmdb.org/t/p/original/5y5y5y5y5y5y5y5y5y5y5y5y5.jpg", overview: "In a dystopia riddled with corruption and cybernetic implants, a talented but reckless street kid strives to become a mercenary outlaw." },

        // Auto-generating placeholders for remaining items to reach ~50
        ...Array.from({ length: 20 }).map((_, i) => ({
            title: `Demo Movie Content ${i + 1}`,
            year: 2020 + (i % 5),
            type: i % 3 === 0 ? "tv" : "movie",
            poster: `https://placehold.co/500x750/1a1a1a/ffffff?text=Demo+${i + 1}`,
            backdrop: `https://placehold.co/1920x1080/0f0f0f/333333?text=Backdrop+${i + 1}`,
            overview: "This is a placeholder overview for demonstration purposes. Cinetron allows you to manage your own media content securely."
        }))
    ];

    console.log(`Seeding ${mockMovies.length} media items...`);

    // Inject Repository directly or use Service if method exists
    // Since we don't have a create method in service for this, we'll use repository pattern via module ref or just extend service
    // For simplicity in this seed script, let's assume we can use the repository

    // NOTE: To do this properly without circular dependency or complex setup, 
    // we should really expose a method in MediaService or use the repository from the module.
    // However, seed.ts is standalone. We need to import TypeOrmModule.forFeature([Media]) in imports? 
    // No, we are getting app context. We can get MediaService.

    // Let's modify MediaService to support bulk create or create one by one
    for (const movie of mockMovies) {
        const title = movie.title;
        // Check if exists
        // We need to add findByTitle to service or just use raw repository if possible, 
        // but getting repository from app context is cleaner if we exported it or service has method
        // We will assume MediaService has a method 'createMock' or we simply add it now.

        // BETTER APPROACH: Use the service's repository
        // Since `mediaService` has `mediaRepository` as private, we can't access it directly in TS without @ts-ignore
        // or we add a helper method to MediaService.

        // For now, let's just cast to any to access repo or use a new method we will add to service in next step
        const repo = (mediaService as any).mediaRepository;

        const exists = await repo.findOne({ where: { title: movie.title } });
        if (!exists) {
            await repo.save({
                title: movie.title,
                year: movie.year,
                type: movie.type,
                posterUrl: movie.poster,
                backdropUrl: movie.backdrop,
                overview: movie.overview,
                filePath: `/mock/path/${movie.title.replace(/\s+/g, '_')}.mp4`,
                processed: true
            });
            console.log(`Added: ${movie.title}`);
        }
    }
}
bootstrap();
