import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Section } from './sections.schema';
import { Model, Document } from 'mongoose';

@Injectable()
export class SectionsService {
  constructor(
    @InjectModel(Section.name) private readonly sectionModel: Model<Section>,
  ) {}

  async findAll(): Promise<Document<unknown, {}, Section>[]> {
    return await this.sectionModel.find();
  }
}
