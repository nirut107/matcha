import {
    Controller,
    Post,
    Get,
    Delete,
    Patch,
    Param,
    Req,
    UseGuards,
    UploadedFile,
    UseInterceptors,
  } from '@nestjs/common';
  import { JwtGuard } from '../auth/jwt.guard';
  import { PicturesService } from './pictures.service';
  import { SyncImagesDto } from './dto/sync-images.dto';
  import { Body } from '@nestjs/common';
  import { FilesInterceptor } from '@nestjs/platform-express';
  import { UploadedFiles } from '@nestjs/common';
  
  @Controller('pictures')
  export class PicturesController {
    constructor(private picturesService: PicturesService) {}
  
    @Post('sync')
    @UseGuards(JwtGuard)
    @UseInterceptors(FilesInterceptor('files', 5))
    sync(
    @Req() req,
    @Body() body: SyncImagesDto,
    @UploadedFiles() files: Express.Multer.File[],
    ) {
    return this.picturesService.syncImages(
        req.user.userId,
        body.images,
        files,
    );
    }
    
    // ✅ get my pictures
    @Get('me')
    @UseGuards(JwtGuard)
    getMyPictures(@Req() req) {
      return this.picturesService.getMyPictures(req.user.userId);
    }
  
    @Get(':id')
    getPictureById(@Param('id') id: string) {
      return this.picturesService.getPicturesByUserId(Number(id));
    }
    
  }