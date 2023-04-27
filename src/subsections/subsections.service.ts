import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Subsection } from './subsection.schema';

@Injectable()
export class SubsectionsService {
  constructor(
    @InjectModel(Subsection.name)
    private readonly subsectionModel: Model<Subsection>,
  ) {}

  async findAll(): Promise<Document<unknown, {}, Subsection>[]> {
    return await this.subsectionModel.find();
  }
}
