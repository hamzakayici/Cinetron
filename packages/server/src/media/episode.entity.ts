import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Media } from './media.entity';

@Entity('episode')
export class Episode {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    seasonNumber: number;

    @Column()
    episodeNumber: number;

    @Column({ type: 'text', nullable: true })
    overview: string;

    @Column()
    filePath: string;

    @Column({ nullable: true })
    stillUrl: string;

    @Column()
    mediaId: string;

    @ManyToOne(() => Media, (media) => media.episodes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mediaId' })
    media: Media;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
