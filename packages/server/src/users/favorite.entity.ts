import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Column, Unique } from 'typeorm';
import { User } from './user.entity';
import { Media } from '../media/media.entity';

@Entity()
@Unique(['userId', 'mediaId']) // Prevent duplicate favorites
export class Favorite {
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

    @CreateDateColumn()
    createdAt: Date;
}
