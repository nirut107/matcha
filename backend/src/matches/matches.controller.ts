import {
    Controller,
    Get,
    Delete,
    Param,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { MatchesService } from './matches.service';
  import { JwtGuard } from '../auth/jwt.guard';
  import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
  
  @ApiTags('matches')
  @ApiBearerAuth()
  @Controller('matches')
  export class MatchesController {
    constructor(private matchesService: MatchesService) {}
  
    @Get()
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Get all matches of current user' })
    @ApiResponse({ status: 200, description: 'List of matches' })
    getMyMatches(@Req() req: any) {
      return this.matchesService.getMyMatches(req.user.userId);
    }
  
    @Get(':userId')
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Check if matched with a user' })
    @ApiResponse({ status: 200, description: 'Match status' })
    checkMatch(@Req() req: any, @Param('userId') userId: string) {
      return this.matchesService.isMatched(
        req.user.userId,
        +userId,
      );
    }
  
    @Delete(':userId')
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Remove match (unmatch)' })
    @ApiResponse({ status: 200, description: 'Match removed' })
    removeMatch(@Req() req: any, @Param('userId') userId: string) {
      return this.matchesService.removeMatch(
        req.user.userId,
        +userId,
      );
    }
  }