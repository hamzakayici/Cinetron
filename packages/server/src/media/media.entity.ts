import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Episode } from './episode.entity';

@Entity('media')
export class Media {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
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

    @Column({ default: false })
    processed: boolean; // True if transcoding is done/not needed

    @OneToMany(() => Episode, (episode) => episode.media, { cascade: true })
    episodes: Episode[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
