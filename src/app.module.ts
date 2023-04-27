import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database';
import { SectionsModule } from './sections';
import { SubsectionsModule } from './subsections';
import { TorrentsModule } from './torrents';
import { RutrackerScrapperModule } from './rutracker-scrapper/rutracker-scrapper.module';
import { SectionService } from './section/section.service';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    DatabaseModule,
    SectionsModule,
    SubsectionsModule,
    TorrentsModule,
    RutrackerScrapperModule,
  ],
  providers: [SectionService],
})
export class AppModule {}
