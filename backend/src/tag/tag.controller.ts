import { Controller, Get } from '@nestjs/common';
import { TagService } from './tag.service';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Tags')
@Controller('tags')
export class TagController {
  constructor(private tagService: TagService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List of available tags',
  })
  getTags() {
    return this.tagService.getAllTags();
  }
}