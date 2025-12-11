import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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
    type: string; // 'movie' | 'tv'

    @Column({ default: false })
    processed: boolean; // True if transcoding is done/not needed

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
