import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  createBooking(
    @Req() req: AuthenticatedRequest,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(
      req.user.userId,
      createBookingDto,
    );
  }

  @Get()
  getMyBookings(@Req() req: AuthenticatedRequest) {
    return this.bookingsService.getUserBookings(req.user.userId);
  }
  @Get('schema-check')
checkDatabaseSchema() {
  return this.bookingsService.checkDatabaseSchema();
}

  @Get(':id')
  getBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingsService.getUserBooking(id, req.user.userId);
  }

  @Patch(':id/cancel')
  cancelBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingsService.cancelBooking(id, req.user.userId);
  }
}
