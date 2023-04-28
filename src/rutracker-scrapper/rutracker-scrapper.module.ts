import { Module, forwardRef } from '@nestjs/common';
import { RutrackerScrapperService } from './rutracker-scrapper.service';
import { RutrackerScrapperController } from './rutracker-scrapper.controller';
import { SectionsModule } from 'src/sections';
import { SubsectionsModule } from 'src/subsections';

@Module({
  imports: [SectionsModule, forwardRef(() => SubsectionsModule)],
  providers: [RutrackerScrapperService],
  controllers: [RutrackerScrapperController],
  exports: [RutrackerScrapperService],
})
export class RutrackerScrapperModule {}
