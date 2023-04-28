import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subsection, SubsectionSchema } from './subsection.schema';
import { SubsectionsService } from './subsections.service';
import { SubsectionsController } from './subsections.controller';
import { RutrackerScrapperModule } from 'src/rutracker-scrapper';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subsection.name, schema: SubsectionSchema },
    ]),
    forwardRef(() => RutrackerScrapperModule),
  ],
  exports: [MongooseModule],
  providers: [SubsectionsService],
  controllers: [SubsectionsController],
})
export class SubsectionsModule {}
