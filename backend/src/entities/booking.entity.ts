
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'flight_id' })
  flightId: string;

  @Column({ default: 'confirmed' })
  status: string;

  @Column({ name: 'passenger_count' })
  passengerCount: number;

  // Total price returned by Duffel for the selected offer.
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  price: string | null;

  // Currency returned by Duffel, for example INR, GBP, or USD.
  @Column({
    type: 'varchar',
    length: 3,
    nullable: true,
  })
  currency: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
