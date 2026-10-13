import { Test, TestingModule } from '@nestjs/testing';

import { FlightsService } from './flights.service';
import { DuffelService } from './duffel/duffel.service';

describe('FlightsService', () => {
  let service: FlightsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlightsService,
        {
          provide: DuffelService,
          useValue: { searchFlights: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<FlightsService>(FlightsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
