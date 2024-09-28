import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  Put,
} from '@nestjs/common';
import { MettingRoomService } from './meeting-room.service';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { generateParseIntPipe } from '../common/utils';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { query } from 'express';

@Controller('meeting-room')
export class MettingRoomController {
  constructor(private readonly meetingRoomService: MettingRoomService) {}

  @Get('list')
  list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query('pageSize', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageSize: number,
    @Query('name') name: string,
    @Query('capacity') capacity: string,
    @Query('equipment') equipment: string,
  ) {
    return this.meetingRoomService.find(
      pageNo,
      pageSize,
      name,
      capacity,
      equipment,
    );
  }

  @Post('create')
  async create(@Body() meetingRoom: CreateMeetingRoomDto) {
    await this.meetingRoomService.create(meetingRoom);
  }

  @Put('update')
  async update(@Body() meetingRoom: UpdateMeetingRoomDto) {
    await this.meetingRoomService.update(meetingRoom);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingRoomService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingRoomService.delete(+id);
  }
}
