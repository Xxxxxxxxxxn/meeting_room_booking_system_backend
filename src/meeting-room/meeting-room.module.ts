import { Module } from '@nestjs/common';
import { MettingRoomService } from './meeting-room.service';
import { MeetingRoom } from './entities/meeting-room.entity';
import { MettingRoomController } from './meeting-room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([MeetingRoom])],
  controllers: [MettingRoomController],
  providers: [MettingRoomService],
})
export class MettingRoomModule {}
