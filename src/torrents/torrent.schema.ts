import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';
import { Subsection } from 'src/subsections/subsection.schema';

export type TorrentDocument = HydratedDocument<Torrent>;

@Schema({ id: true })
export class Torrent {
  @Prop()
  name: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Subsection', required: true })
  subsection: Subsection;
}

export const TorrentSchema = SchemaFactory.createForClass(Torrent);
