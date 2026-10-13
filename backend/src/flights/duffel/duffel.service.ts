
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CurrencyService } from '../currency.service';

@Injectable()
export class DuffelService {
  constructor(
    private readonly configService: ConfigService,
    private readonly currencyService: CurrencyService,
  ) {}

  async searchFlights(searchData: any) {
    const token = this.configService.get<string>('DUFFEL_API_TOKEN');

    if (!token) {
      throw new InternalServerErrorException(
        'Flight search is not configured. Please contact support.',
      );
    }

    const departureDate = searchData.departureDate;

    if (!departureDate || !/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
      throw new BadRequestException(
        'Please provide a valid departure date in YYYY-MM-DD format.',
      );
    }

    const departure = new Date(`${departureDate}T00:00:00Z`);

    if (
      Number.isNaN(departure.getTime()) ||
      departure.toISOString().slice(0, 10) !== departureDate
    ) {
      throw new BadRequestException('Please provide a valid departure date.');
    }

    if (departureDate < new Date().toISOString().slice(0, 10)) {
      throw new BadRequestException(
        'That departure date is in the past. Please choose today or a future date.',
      );
    }

    if (searchData.returnDate) {
      const returnDate = searchData.returnDate;

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(returnDate) ||
        Number.isNaN(new Date(`${returnDate}T00:00:00Z`).getTime()) ||
        new Date(`${returnDate}T00:00:00Z`).toISOString().slice(0, 10) !==
          returnDate
      ) {
        throw new BadRequestException('Please provide a valid return date.');
      }

      if (returnDate < departureDate) {
        throw new BadRequestException(
          'The return date cannot be earlier than the departure date.',
        );
      }
    }

    const origin = String(searchData.origin || '').trim().toUpperCase();
    const destination = String(searchData.destination || '')
      .trim()
      .toUpperCase();

    if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
      throw new BadRequestException(
        'Origin and destination must be 3-letter IATA airport codes.',
      );
    }

    if (origin === destination) {
      throw new BadRequestException(
        'Origin and destination must be different airports.',
      );
    }

    const passengers = Number(searchData.passengers ?? 1);

    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) {
      throw new BadRequestException(
        'Passenger count must be a whole number between 1 and 9.',
      );
    }

    const slices: {
      origin: string;
      destination: string;
      departure_date: string;
    }[] = [
      {
        origin,
        destination,
        departure_date: departureDate,
      },
    ];

    if (searchData.returnDate) {
      slices.push({
        origin: destination,
        destination: origin,
        departure_date: searchData.returnDate,
      });
    }

    try {
      const response = await axios.post(
        'https://api.duffel.com/air/offer_requests',
        {
          data: {
            slices,
            passengers: Array.from({ length: passengers }, () => ({
              type: 'adult',
            })),
            cabin_class: 'economy',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Duffel-Version': 'v2',
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );

      const result = response.data?.data;
      const providerOffers = result?.offers ?? [];

      console.log('Duffel offers found:', providerOffers.length);

      const offers = await Promise.all(
        providerOffers.map(async (offer: any) => {
          const originalPrice = offer.total_amount;
          const originalCurrency = offer.total_currency;

          // Keep incomplete provider offers instead of inventing a price.
          if (
            originalPrice == null ||
            !originalCurrency ||
            !Number.isFinite(Number(originalPrice))
          ) {
            return {
              ...offer,
              original_price: originalPrice ?? null,
              original_currency: originalCurrency ?? null,
              price_inr: null,
              currency_inr: 'INR',
            };
          }

          // Convert the live provider price to Indian Rupees.
          const priceINR = await this.currencyService.convertToINR(
            originalPrice,
            originalCurrency,
          );

          return {
            ...offer,
            original_price: originalPrice,
            original_currency: originalCurrency,
            price_inr: priceINR,
            currency_inr: 'INR',
          };
        }),
      );

      return {
        id: result?.id,
        offers,
      };
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      this.handleDuffelError(error, 'search');
    }
  }

  /**
   * Retrieve a selected Duffel offer and its provider-returned price.
   * This does not create a booking or process a payment.
   */
  async getFlightOffer(offerId: string) {
    const token = this.configService.get<string>('DUFFEL_API_TOKEN');

    if (!token) {
      throw new InternalServerErrorException(
        'Flight search is not configured. Please contact support.',
      );
    }

    const normalizedOfferId = String(offerId || '').trim();

    if (!normalizedOfferId) {
      throw new BadRequestException('A valid flight offer ID is required.');
    }

    try {
      const response = await axios.get(
        `https://api.duffel.com/air/offers/${encodeURIComponent(normalizedOfferId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Duffel-Version': 'v2',
            Accept: 'application/json',
          },
          timeout: 20000,
        },
      );

      const offer = response.data?.data;

      if (!offer?.id || offer.total_amount == null || !offer.total_currency) {
        throw new ServiceUnavailableException(
          'The flight provider did not return complete offer details.',
        );
      }

      return {
        id: offer.id,
        price: offer.total_amount,
        currency: offer.total_currency,
        expiresAt: offer.expires_at ?? null,
        liveMode: offer.live_mode,
      };
    } catch (error: unknown) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      this.handleDuffelError(error, 'retrieve');
    }
  }

  private handleDuffelError(error: unknown, action: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errors = error.response?.data?.errors;

      if (status === 404) {
        throw new BadRequestException(
          'This flight offer could not be found. Please search for flights again.',
        );
      }

      if (status === 422) {
        const details = Array.isArray(errors)
          ? errors
              .map((item: { message?: string }) => item.message)
              .filter(Boolean)
              .join(' ')
          : '';

        throw new BadRequestException(
          details ||
            'Duffel could not process this request. Please check the flight details.',
        );
      }

      if (status === 401 || status === 403) {
        throw new InternalServerErrorException(
          'Flight provider authentication failed. Please contact support.',
        );
      }

      if (status === 429) {
        throw new ServiceUnavailableException(
          'Flight search is temporarily busy. Please try again shortly.',
        );
      }

      if (!error.response || (status != null && status >= 500)) {
        throw new ServiceUnavailableException(
          'The flight provider is temporarily unavailable. Please try again.',
        );
      }

      throw new BadRequestException(
        `The flight provider could not ${action} this request.`,
      );
    }

    if (
      error instanceof BadRequestException ||
      error instanceof InternalServerErrorException ||
      error instanceof ServiceUnavailableException
    ) {
      throw error;
    }

    throw new InternalServerErrorException(
      `An unexpected error occurred while attempting to ${action} a flight offer.`,
    );
  }
}
