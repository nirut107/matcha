// dates.controller.ts
import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { DatesService } from './dates.service';
import { RequestDateDto, RespondDateDto, CancelDateDto } from './dto/dates.dto';
// สมมติว่าคุณมี AuthGuard เพื่อดึงข้อมูล user ที่ล็อกอินอยู่
import { JwtGuard } from 'src/auth/jwt.guard';


@Controller('dates')
export class DatesController {
  constructor(private readonly datesService: DatesService) {}

  @Post('request')
  @UseGuards(JwtGuard)
  async requestDate(@Req() req, @Body() dto: RequestDateDto) {
    const userId = req.user.id;
    return this.datesService.requestDate(userId, dto);
  }

  @Post('respond')
  @UseGuards(JwtGuard)
  async respondDate(@Req() req, @Body() dto: RespondDateDto) {
    const userId = req.user.id;
    return this.datesService.respondDate(userId, dto);
  }

  @Post('cancel')
  @UseGuards(JwtGuard)
  async cancelDate(@Req() req, @Body() dto: CancelDateDto) {
    const userId = req.user.id;
    return this.datesService.cancelDate(userId, dto);
  }

  @Get('calendar')
  @UseGuards(JwtGuard)
  async getCalendar(@Req() req) {
    const userId = req.user.id;
    return this.datesService.getCalendar(userId);
  }
}