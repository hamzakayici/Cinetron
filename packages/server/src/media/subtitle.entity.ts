import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Media } from './media.entity';

@Entity()
export class Subtitle {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    mediaId: string;

    @ManyToOne(() => Media, media => media.id, { onDelete: 'CASCADE' })
    media: Media;

    @Column()
    language: string; // ISO 639-1 code: 'tr', 'en', etc.

    @Column()
    label: string; // Display name: 'Türkçe', 'English', etc.

    @Column()
    url: string; // Path to subtitle file: '/files/uploads/subtitles/uuid.vtt'

    @CreateDateColumn()
    createdAt: Date;
}
