import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { DuffelService } from './duffel.service';

describe('DuffelService', () => {
  let service: DuffelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuffelService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DuffelService>(DuffelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
