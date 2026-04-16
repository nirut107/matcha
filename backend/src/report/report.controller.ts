import {
    Controller,
    Post,
    Body,
    Req,
    UseGuards,
    BadRequestException,
  } from '@nestjs/common';
  import { JwtGuard } from '../auth/jwt.guard';
  import { DatabaseService } from '../database/database.service';
  import { CreateReportDto } from './dto/create-report.dto';
  
  @Controller('reports')
  export class ReportController {
    constructor(private readonly db: DatabaseService) {}
  
    @UseGuards(JwtGuard)
    @Post()
    async createReport(@Req() req: any, @Body() dto: CreateReportDto) {
      const reporterId = req.user.userId;
  
      if (reporterId === dto.reported_id) {
        throw new BadRequestException('You cannot report yourself');
      }
  
      const existing = await this.db.query(
        `
        SELECT 1 FROM reports
        WHERE reporter_id = $1 AND reported_id = $2
        `,
        [reporterId, dto.reported_id],
      );
  
      if (existing.rows.length > 0) {
        throw new BadRequestException('You already reported this user');
      }

      const result = await this.db.query(
        `
        INSERT INTO reports (reporter_id, reported_id, reason)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [reporterId, dto.reported_id, dto.reason],
      );
  
      return result.rows[0];
    }
  }