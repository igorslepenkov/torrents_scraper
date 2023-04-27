import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Section, SectionSchema } from './sections.schema';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Section.name, schema: SectionSchema }]),
  ],
  exports: [MongooseModule],
  providers: [SectionsService],
  controllers: [SectionsController],
})
export class SectionsModule {}
