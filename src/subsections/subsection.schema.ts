import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Section } from 'src/sections/sections.schema';

export type SubsectionDocument = HydratedDocument<Subsection>;

@Schema({ id: true })
export class Subsection {
  @Prop()
  name: string;

  @Prop()
  link: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true,
  })
  section: Section;
}

export const SubsectionSchema = SchemaFactory.createForClass(Subsection);
