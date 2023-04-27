import { Module } from '@nestjs/common';
import { RutrackerScrapperService } from './rutracker-scrapper.service';
import { RutrackerScrapperController } from './rutracker-scrapper.controller';
import { SectionsModule } from 'src/sections';
import { TorrentsModule } from 'src/torrents';
import { SubsectionsModule } from 'src/subsections';

@Module({
  imports: [SectionsModule, TorrentsModule, SubsectionsModule],
  providers: [RutrackerScrapperService],
  controllers: [RutrackerScrapperController],
})
export class RutrackerScrapperModule {}
