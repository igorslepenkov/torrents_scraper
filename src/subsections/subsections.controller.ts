import { Controller, Get, Param, Query } from '@nestjs/common';
import { SubsectionsService } from './subsections.service';
import { RutrackerScrapperService } from 'src/rutracker-scrapper';

@Controller('subsections')
export class SubsectionsController {
  constructor(
    private readonly subsectionsService: SubsectionsService,
    private rutrackerScrapperService: RutrackerScrapperService,
  ) {}

  @Get()
  async index() {
    return await this.subsectionsService.findAll();
  }

  @Get(':subsection_id')
  async getTorrentsOfSubsection(
    @Param('subsection_id') subsectionId: string,
    @Query('max') max: number,
  ) {
    return await this.rutrackerScrapperService.getSubsectionsTorrents(
      subsectionId,
      max,
    );
  }
}
