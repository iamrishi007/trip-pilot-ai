
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: 'duffel-flight-id',
    description: 'Duffel flight/offer ID',
  })
  @IsString()
  @IsNotEmpty()
  flightId: string;

  @ApiProperty({
    example: 1,
    description: 'Number of passengers',
  })
  @IsInt()
  @Min(1)
  passengerCount: number;
}
