import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database';
import { SectionsModule } from './sections';
import { SubsectionsModule } from './subsections';
import { RutrackerScrapperModule } from './rutracker-scrapper';
import { configuration } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    DatabaseModule,
    SectionsModule,
    SubsectionsModule,
    RutrackerScrapperModule,
  ],
})
export class AppModule {}
