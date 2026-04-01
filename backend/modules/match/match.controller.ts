import { Controller, Get, Req } from '@nestjs/common';
import { MatchService } from './match.service';

@Controller('match')
export class MatchController {
  constructor(private matchService: MatchService) {}

  @Get()
  async getMatches(@Req() req: any) {
    const userId = req.user.id; // มาจาก JWT
    return this.matchService.getMatches(userId);
  }
}