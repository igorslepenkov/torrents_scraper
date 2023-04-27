import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Torrent, TorrentSchema } from './torrent.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Torrent.name, schema: TorrentSchema }]),
  ],
  exports: [MongooseModule],
})
export class TorrentsModule {}
