import { Controller, Get } from '@nestjs/common';
import { Document } from 'mongoose';

import { Section } from 'src/sections';
import { RutrackerScrapperService } from './rutracker-scrapper.service';

@Controller('scrapper')
export class RutrackerScrapperController {
  constructor(private rutrackerScrapperService: RutrackerScrapperService) {}

  @Get('get_tree')
  async getSectionsTree(): Promise<Document<unknown, {}, Section>[]> {
    return await this.rutrackerScrapperService.getRutrackerSectionsTree();
  }
}
