import { Controller } from '@nestjs/common';
import { SwipeService } from './swipe.service';
import { Post, Req, Body } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.guard';
import { ActionSwipeDto } from './dto/swip.dto';

@Controller('swipe')
export class SwipeController {
  constructor(private swipeService: SwipeService) {}
  @Post('swipe')
  @UseGuards(JwtGuard)
  swipe(
    @Req() req,
    @Body() body: ActionSwipeDto,
  ) {
    return this.swipeService.swipeUser(
      req.user.userId,
      body.targetId,
      body.action,
    );
  }
}
