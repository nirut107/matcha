import { Controller, Post, Req, Body } from '@nestjs/common';
import { LikeService } from './like.service';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { raceWith } from 'rxjs';

class LikeDto {
    @ApiProperty({ description: 'ID of the user to like', example: 2 })
    likedId: number;
}

@Controller('like')
export class LikeController {
    constructor(private likeService: LikeService) {}

    @Post()
    @UseGuards(JwtGuard)
    @ApiTags('Like')
    async likePicture(@Req() req: any, @Body() body: LikeDto) {
        return this.likeService.likeUser(req.user.userId, body.likedId);
    }
}
