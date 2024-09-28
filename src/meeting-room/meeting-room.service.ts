import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { MeetingRoom } from './entities/meeting-room.entity';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { EntityManager, Like, Repository } from 'typeorm';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';

@Injectable()
export class MettingRoomService {
  @InjectRepository(MeetingRoom)
  private repository: Repository<MeetingRoom>;

  @InjectEntityManager()
  entityManager: EntityManager;

  initData() {
    const room1 = new MeetingRoom();
    room1.name = '木星';
    room1.capacity = 10;
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '金星';
    room2.capacity = 5;
    room2.equipment = '';
    room2.location = '二层东';

    const room3 = new MeetingRoom();
    room3.name = '天王星';
    room3.capacity = 30;
    room3.equipment = '白板，电视';
    room3.location = '三层东';

    this.repository.insert([room1, room2, room3]);
  }

  async find(
    pageNo: number,
    pageSize: number,
    name?: string,
    capacity?: string,
    equipment?: string,
  ) {
    if (pageNo < 1) {
      throw new BadRequestException('页码不能小于1');
    }

    const skipCount = (pageNo - 1) * pageSize;

    const condition: Record<string, any> = {};
    if (name) {
      condition.name = Like(`%${name}%`);
    }
    if (capacity) {
      condition.capacity = Like(`%${capacity}%`);
    }
    if (equipment) {
      condition.equipment = Like(`%${equipment}%`);
    }

    const [meetingRooms, totalCount] = await this.repository.findAndCount({
      skip: skipCount,
      take: pageSize,
      where: condition,
    });

    return {
      meetingRooms,
      totalCount,
    };
  }

  async create(meetingRoom: CreateMeetingRoomDto) {
    const room = await this.repository.find({
      where: { name: meetingRoom.name },
    });
    if (room.length) {
      throw new BadRequestException('会议室已存在');
    }
    return await this.repository.save(meetingRoom);
  }

  async update(meetingRoom: UpdateMeetingRoomDto) {
    const room = await this.repository.findOneBy({ id: meetingRoom.id });
    if (!room) {
      throw new BadRequestException('会议室不存在');
    }

    // if (meetingRoom.name) {
    //   room.name = meetingRoom.name;
    // }
    // if (meetingRoom.capacity) {
    //   room.capacity = meetingRoom.capacity;
    // }
    // if (meetingRoom.equipment) {
    //   room.equipment = meetingRoom.equipment;
    // }
    // if (meetingRoom.location) {
    //   room.location = meetingRoom.location;
    // }
    // if (meetingRoom.description) {
    //   room.description = meetingRoom.description;
    // }

    meetingRoom = {
      id: meetingRoom.id,
      name: meetingRoom.name ? meetingRoom.name : room.name,
      capacity: meetingRoom.capacity ? meetingRoom.capacity : room.capacity,
      equipment: meetingRoom.equipment ? meetingRoom.equipment : room.equipment,
      location: meetingRoom.location ? meetingRoom.location : room.location,
      description: meetingRoom.description
        ? meetingRoom.description
        : room.description,
    };
    return await this.repository.update({ id: meetingRoom.id }, meetingRoom);
  }

  async findOne(id: number) {
    return await this.repository.findOneBy({ id });
  }

  async delete(id: number) {
    // 外键关联删除，先找出关联的数据在一条条删除
    //const bookings = await this.entityManager.findBy(Booking, {
    //   room: { id },
    // });
    // for (let i = 0; i < bookings.length; i++) {
    //   await this.entityManager.delete(Booking, bookings[i].id);
    // }
    await this.repository.delete(id);
    return 'success';
  }
}
