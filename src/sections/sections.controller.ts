import { Controller, Get } from '@nestjs/common';
import { SectionsService } from './sections.service';

@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  async index() {
    return await this.sectionsService.findAll();
  }
}
