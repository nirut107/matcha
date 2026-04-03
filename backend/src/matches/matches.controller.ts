import { Controller, Get, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtGuard } from '../auth/jwt.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { MatchResponseDto } from './dto/match-response.dto';

@ApiTags('matches')
@ApiBearerAuth()
@Controller('matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get()
  @UseGuards(JwtGuard)
  @ApiOkResponse({
    description: 'List of user matches with last message + unread count',
    type: MatchResponseDto,
    isArray: true,
  })
  async getMyMatches(@Req() req) {
    return this.matchesService.getMyMatches(req.user.userId);
  }

  @Get(':userId')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Check if matched with a user' })
  @ApiResponse({ status: 200, description: 'Match status' })
  checkMatch(@Req() req: any, @Param('userId') userId: string) {
    return this.matchesService.isMatched(req.user.userId, +userId);
  }

  @Delete(':userId')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Remove match (unmatch)' })
  @ApiResponse({ status: 200, description: 'Match removed' })
  removeMatch(@Req() req: any, @Param('userId') userId: string) {
    return this.matchesService.removeMatch(req.user.userId, +userId);
  }
}
