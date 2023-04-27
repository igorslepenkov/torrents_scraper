import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Section } from 'src/sections/sections.schema';
import { Torrent } from 'src/torrents/torrent.schema';

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

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Torrent' })
  torrents: Torrent[];
}

export const SubsectionSchema = SchemaFactory.createForClass(Subsection);
