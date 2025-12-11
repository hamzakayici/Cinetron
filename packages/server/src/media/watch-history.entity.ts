import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Media } from './media.entity';

@Entity('watch_history')
export class WatchHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    mediaId: string;

    @ManyToOne(() => Media, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mediaId' })
    media: Media;

    @Column({ type: 'int', default: 0 })
    progressSeconds: number;

    @UpdateDateColumn()
    lastWatchedAt: Date;
}
