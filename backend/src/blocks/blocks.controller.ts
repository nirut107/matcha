import {
    Controller,
    Post,
    Delete,
    Get,
    Param,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { BlocksService } from './blocks.service';
  import { JwtGuard } from '../auth/jwt.guard';
  import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
  } from '@nestjs/swagger';
  
  @ApiTags('blocks')
  @ApiBearerAuth()
  @Controller('blocks')
  export class BlocksController {
    constructor(private blocksService: BlocksService) {}
  
    @Post(':userId')
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Block a user' })
    @ApiResponse({ status: 201, description: 'User blocked' })
    block(@Req() req: any, @Param('userId') userId: string) {
      return this.blocksService.blockUser(
        req.user.userId,
        +userId,
      );
    }
  
    @Delete(':userId')
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Unblock a user' })
    @ApiResponse({ status: 200, description: 'User unblocked' })
    unblock(@Req() req: any, @Param('userId') userId: string) {
      return this.blocksService.unblockUser(
        req.user.userId,
        +userId,
      );
    }
  
    @Get()
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Get blocked users' })
    @ApiResponse({ status: 200, description: 'Blocked users list' })
    getMyBlocks(@Req() req: any) {
      return this.blocksService.getMyBlocks(req.user.userId);
    }
  }