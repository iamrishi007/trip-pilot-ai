import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { FlightsService } from './flights.service';
import { SearchFlightsDto } from '../dto/search-flights.dto';

@ApiTags('Flights')
@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Post('search')
  @ApiOperation({ summary: 'Search available flights' })
  searchFlights(@Body() searchFlightsDto: SearchFlightsDto) {
    return this.flightsService.searchFlights(searchFlightsDto);
  }
}