import { Controller } from '@nestjs/common';
import { VisitService } from './visit.service';
import { Get, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.guard';
import { VisitorProfileDto } from './dto/VisitorProfileDto.dto';

@Controller('visit')
export class VisitController {
  constructor(private visitService: VisitService) {}

  @Get('visits')
  @ApiOperation({ summary: 'Get list of users who visited my profile' })
  @UseGuards(JwtGuard)
  @ApiResponse({ 
    status: 200, 
    type: [VisitorProfileDto],
    description: 'List of recent profile visitors' 
  })
  async getVisits(@Req() req: any) {
    const userId = req.user.userId;
    return this.visitService.getProfileVisits(userId);
  }
}
