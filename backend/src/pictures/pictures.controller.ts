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
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('pictures')
export class PicturesController {
  constructor(private picturesService: PicturesService) {}

  @Post('sync')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9) +
            extname(file.originalname);

          cb(null, uniqueName);
        },
      }),
    }),
  )
  sync(
    @Req() req,
    @Body('images') images: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log('RAW images:', images);
    console.log('FILES:', files);

    const parsedImages = JSON.parse(images);

    return this.picturesService.syncImages(
      req.user.userId,
      parsedImages,
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
