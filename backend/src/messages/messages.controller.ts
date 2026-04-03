import { MessagesService } from './messages.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

@Controller('messages')
@ApiTags('messages') // 👈 show group in Swagger
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get(':matchId')
  @UseGuards(JwtGuard)
  @ApiParam({
    name: 'matchId',
    type: Number,
    example: 3,
  })
  async getMessage(
    @Req() req,
    @Param('matchId') matchId: string,
  ) {
    return this.messagesService.getMessages(
      req.user.userId,
      Number(matchId),
    );
  }
}
