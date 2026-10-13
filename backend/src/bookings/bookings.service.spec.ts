
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { BookingsService } from './bookings.service';
import { Booking } from '../entities/booking.entity';
import { DuffelService } from '../flights/duffel/duffel.service';

describe('BookingsService', () => {
  let service: BookingsService;

  const repository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const duffelService = {
    getFlightOffer: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: repository,
        },
        {
          provide: DuffelService,
          useValue: duffelService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a confirmed demo booking with the offer price', async () => {
    const saved = {
      id: 'booking-1',
      userId: 'user-1',
      flightId: 'off_123',
      passengerCount: 2,
      status: 'confirmed',
      price: '350.00',
      currency: 'INR',
    };

    repository.findOne.mockResolvedValue(null);
    duffelService.getFlightOffer.mockResolvedValue({
      id: 'off_123',
      price: '350.00',
      currency: 'INR',
    });
    repository.create.mockReturnValue(saved);
    repository.save.mockResolvedValue(saved);

    await expect(
      service.createBooking('user-1', {
        flightId: 'off_123',
        passengerCount: 2,
      }),
    ).resolves.toEqual(saved);

    expect(duffelService.getFlightOffer).toHaveBeenCalledWith('off_123');

    expect(repository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      flightId: 'off_123',
      passengerCount: 2,
      status: 'confirmed',
      price: '350.00',
      currency: 'INR',
    });
  });

  it('prevents duplicate confirmed bookings for the same flight', async () => {
    repository.findOne.mockResolvedValue({
      id: 'existing',
      status: 'confirmed',
    });

    await expect(
      service.createBooking('user-1', {
        flightId: 'off_123',
        passengerCount: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(duffelService.getFlightOffer).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('returns only the requesting user booking', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.getUserBooking('missing', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
