import { Controller, Get } from '@nestjs/common';
import { SubsectionsService } from './subsections.service';

@Controller('subsections')
export class SubsectionsController {
  constructor(private readonly subsectionsService: SubsectionsService) {}

  @Get()
  async index() {
    return await this.subsectionsService.findAll();
  }
}
