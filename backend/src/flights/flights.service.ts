import { Injectable } from '@nestjs/common';
import { DuffelService } from './duffel/duffel.service';

@Injectable()
export class FlightsService {
  constructor(
    private readonly duffelService: DuffelService,
  ) {}

  async searchFlights(searchData: any) {
    return this.duffelService.searchFlights(searchData);
  }
}