import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Episode } from './episode.entity';

@Entity('media')
export class Media {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    filePath: string;

    @Column({ nullable: true })
    originalFileName: string;

    @Column({ nullable: true })
    posterUrl: string;

    @Column({ nullable: true })
    backdropUrl: string;

    @Column({ type: 'text', nullable: true })
    overview: string;

    @Column({ nullable: true })
    year: number;

    @Column({ default: 'movie' })
    type: string; // 'movie' | 'tv' | 'series'

    @Column("text", { array: true, default: [] })
    genres: string[];

    @Column({ type: 'jsonb', nullable: true })
    cast: { name: string; character: string; profile_path: string | null }[];

    @Column({ nullable: true })
    director: string;

    @Column({ nullable: true })
    tmdbId: number;

    @Column({ nullable: true })
    runtime: number; // in minutes

    @Column({ type: 'date', nullable: true })
    releaseDate: Date;

    @Column({ default: false })
    processed: boolean; // True if transcoding is done/not needed

    @OneToMany(() => Episode, (episode) => episode.media, { cascade: true })
    episodes: Episode[];

    @Column({ type: 'simple-json', nullable: true })
    qualities: Record<string, string>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
