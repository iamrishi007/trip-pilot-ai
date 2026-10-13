import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

function toIataCode(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toUpperCase();
}

export class SearchFlightsDto {
  @ApiProperty({
    example: 'DEL',
    description: 'Departure airport IATA code',
  })
  @Transform(({ value }) => toIataCode(value))
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/, {
    message: 'Origin must be a 3-letter IATA airport code.',
  })
  origin: string;

  @ApiProperty({
    example: 'BOM',
    description: 'Destination airport IATA code',
  })
  @Transform(({ value }) => toIataCode(value))
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/, {
    message: 'Destination must be a 3-letter IATA airport code.',
  })
  destination: string;

  @ApiProperty({
    example: '2026-11-15',
    description: 'Departure date',
  })
  @IsNotEmpty()
  @IsDateString()
  departureDate: string;

  @ApiProperty({
    example: '2026-11-22',
    description: 'Return date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @ApiProperty({
    example: 1,
    description: 'Number of passengers',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9)
  passengers?: number;
}
