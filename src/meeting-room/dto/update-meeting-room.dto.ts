import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';
import { CreateMeetingRoomDto } from './create-meeting-room.dto';

// dto是用来规定保存对象得到格式的
// entiry是表结构
export class UpdateMeetingRoomDto extends PartialType(CreateMeetingRoomDto) {
  @IsNotEmpty({
    message: '会议室id不能为空',
  })
  id: number;
}
