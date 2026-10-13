import { Module } from '@nestjs/common';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';
import { DuffelService } from './duffel/duffel.service';
import { CurrencyService } from './currency.service';

@Module({
  controllers: [FlightsController],
  providers: [FlightsService, DuffelService,CurrencyService],
  exports: [DuffelService, CurrencyService],
})
export class FlightsModule {}