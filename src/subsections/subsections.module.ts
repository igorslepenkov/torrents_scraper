import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subsection, SubsectionSchema } from './subsection.schema';
import { SubsectionsService } from './subsections.service';
import { SubsectionsController } from './subsections.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subsection.name, schema: SubsectionSchema },
    ]),
  ],
  exports: [MongooseModule],
  providers: [SubsectionsService],
  controllers: [SubsectionsController],
})
export class SubsectionsModule {}
