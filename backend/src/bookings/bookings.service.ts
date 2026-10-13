
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Booking } from '../entities/booking.entity';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { DuffelService } from '../flights/duffel/duffel.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly duffelService: DuffelService,
  ) {}

  // Create a demo booking and save its provider-returned price.
  async createBooking(
    userId: string,
    createBookingDto: CreateBookingDto,
  ) {
    const existing = await this.bookingRepository.findOne({
      where: {
        userId,
        flightId: createBookingDto.flightId,
        status: 'confirmed',
      },
    });

    if (existing) {
      throw new ConflictException(
        'You already have a confirmed booking for this flight. Open My Bookings to view it.',
      );
    }

    // Retrieve the offer price and currency from Duffel.
    // Do not accept price or currency directly from the frontend.
    const offer = await this.duffelService.getFlightOffer(
      createBookingDto.flightId,
    );

    const price = Number(offer.price);

    if (!Number.isFinite(price) || price < 0) {
      throw new InternalServerErrorException(
        'The flight provider returned an invalid offer price.',
      );
    }

    const currency = String(offer.currency || '').toUpperCase();

    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new InternalServerErrorException(
        'The flight provider returned an invalid currency.',
      );
    }

    try {
      const booking = this.bookingRepository.create({
        userId,
        flightId: createBookingDto.flightId,
        passengerCount: createBookingDto.passengerCount,
        status: 'confirmed',
        price: price.toFixed(2),
        currency,
      });

      return await this.bookingRepository.save(booking);
    } catch (error) {
      this.logger.error(
        'Failed to create demo booking',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Failed to save demo booking. Check the backend logs.',
      );
    }
  }

  // Get all bookings belonging to a user.
  async getUserBookings(userId: string) {
    return this.bookingRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Get one booking belonging to the requesting user.
  async getUserBooking(id: string, userId: string) {
    const booking = await this.bookingRepository.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  
  async checkDatabaseSchema() {
    return this.bookingRepository.query(`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name,
        to_regclass('public.bookings') AS bookings_table,
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'bookings'
            AND column_name = 'price'
        ) AS has_price_column
    `);
  }

  // Cancel a demo booking.
  async cancelBooking(id: string, userId: string) {
    const booking = await this.getUserBooking(id, userId);

    if (booking.status === 'cancelled') {
      return booking;
    }

    booking.status = 'cancelled';

    return this.bookingRepository.save(booking);
  }
}
