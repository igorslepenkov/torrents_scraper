import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Subsection } from 'src/subsections/subsection.schema';

export type SectionDocument = HydratedDocument<Section>;

@Schema({ id: true })
export class Section {
  @Prop()
  name: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subsection' }] })
  subsections: Subsection[];
}

export const SectionSchema = SchemaFactory.createForClass(Section);
