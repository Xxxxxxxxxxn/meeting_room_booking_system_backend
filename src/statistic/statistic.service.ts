import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Booking } from 'src/booking/entities/booking.entity';
import { MeetingRoom } from 'src/meeting-room/entities/meeting-room.entity';
import { User } from 'src/user/entities/user.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class StatisticService {
  @InjectEntityManager()
  entityManager: EntityManager;

  async userBookingCount(startTime: string, endTime: string) {
    const query = this.entityManager
      .createQueryBuilder(Booking, 'b')
      .select('u.id', 'userId')
      .addSelect('u.username', 'username')
      .leftJoin(User, 'u', 'u.id=b.userId')
      .addSelect('count(1)', 'bookingCount')

      // 这里为什么是b.user而不是u.id 结果没却别
      .addGroupBy('b.user');

    if (startTime && endTime) {
      query.where('b.startTime between :startTime and :endTime', {
        startTime,
        endTime,
      });
    } else if (endTime) {
      query.where('b.endTime <= :endTime', { endTime });
    } else if (startTime) {
      query.where('b.startTime >= :startTime', { startTime });
    }

    return await query.getRawMany();
  }

  async meetingRoomUsedCount(startTime?: string, endTime?: string) {
    const query = this.entityManager
      .createQueryBuilder(MeetingRoom, 'm')
      .select('m.id', 'meetingRoomId')
      .addSelect('m.name', 'meetingRoomName')
      .leftJoin(Booking, 'b', 'b.roomId=m.id')
      .addSelect('count(1)', 'usedCount')
      .groupBy('m.id');

    if (startTime && endTime) {
      query.where('b.startTime between :startTime and :endTime', {
        startTime,
        endTime,
      });
    } else if (endTime) {
      query.where('b.endTime <= :endTime', { endTime });
    } else if (startTime) {
      query.where('b.startTime >= :startTime', { startTime });
    }

    return await query.getRawMany();
  }
}
