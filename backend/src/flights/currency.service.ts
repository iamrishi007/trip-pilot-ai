
import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';

interface ExchangeRateResponse {
  result?: string;
  base_code?: string;
  rates?: Record<string, number>;
}

@Injectable()
export class CurrencyService {
  private inrRate: number | null = null;
  private lastFetchedAt = 0;

  async convertToINR(
    amount: string | number,
    currency: string,
  ): Promise<number> {
    const price = Number(amount);

    if (!Number.isFinite(price) || price < 0) {
      throw new ServiceUnavailableException(
        'The flight price is invalid.',
      );
    }

    const baseCurrency = currency.toUpperCase();

    if (baseCurrency === 'INR') {
      return price;
    }

    try {
      // Refresh the GBP-to-INR rate every hour.
      if (
        baseCurrency === 'GBP' &&
        this.inrRate !== null &&
        Date.now() - this.lastFetchedAt < 60 * 60 * 1000
      ) {
        return Number((price * this.inrRate).toFixed(2));
      }

      const response = await axios.get<ExchangeRateResponse>(
        `https://open.er-api.com/v6/latest/${encodeURIComponent(baseCurrency)}`,
        { timeout: 10000 },
      );

      const rate = response.data?.rates?.INR;

      if (
        response.data?.result !== 'success' ||
        typeof rate !== 'number' ||
        !Number.isFinite(rate) ||
        rate <= 0
      ) {
        throw new Error('Exchange rate unavailable');
      }

      if (baseCurrency === 'GBP') {
        this.inrRate = rate;
        this.lastFetchedAt = Date.now();
      }

      return Number((price * rate).toFixed(2));
    } catch {
      throw new ServiceUnavailableException(
        'Currency conversion is temporarily unavailable. Please try again.',
      );
    }
  }
}
