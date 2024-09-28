import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking } from './entities/booking.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  EntityManager,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { MeetingRoom } from 'src/meeting-room/entities/meeting-room.entity';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class BookingService {
  @InjectEntityManager()
  entityManager: EntityManager;

  @Inject(RedisService)
  private redis: RedisService;

  @Inject(EmailService)
  private email: EmailService;

  async initData() {
    // 人员
    // 会议室
    // 预定
    const user1 = await this.entityManager.findOneBy(User, { id: 1 });
    const user2 = await this.entityManager.findOneBy(User, { id: 2 });
    const room1 = await this.entityManager.findOneBy(MeetingRoom, { id: 1 });
    const room2 = await this.entityManager.findOneBy(MeetingRoom, { id: 2 });

    const booking1 = new Booking();
    booking1.user = user1;
    booking1.room = room1;
    booking1.startTime = new Date();
    booking1.endTime = new Date(Date.now() + 1000 * 60 * 60);
    booking1.status = '已预定';
    booking1.note = '备注';

    const booking2 = new Booking();
    booking2.user = user1;
    booking2.room = room2;
    booking2.startTime = new Date();
    booking2.endTime = new Date(Date.now() + 1000 * 60 * 60);
    booking2.status = '已预定';
    booking2.note = '备注';

    const booking3 = new Booking();
    booking3.user = user2;
    booking3.room = room2;
    booking3.startTime = new Date();
    booking3.endTime = new Date(Date.now() + 1000 * 60 * 60);
    booking3.status = '已预定';
    booking3.note = '备注';

    const booking4 = new Booking();
    booking4.user = user2;
    booking4.room = room2;
    booking4.startTime = new Date();
    booking4.endTime = new Date(Date.now() + 1000 * 60 * 60);
    booking4.status = '已预定';
    booking4.note = '备注';

    await this.entityManager.save([booking1, booking2, booking3, booking4]);
  }
  async create(createBookingDto: CreateBookingDto, userId: number) {
    // 这样不行 需要拿到 room 和user信息
    // await this.entityManager.save(Booking, {
    //   ...createBookingDto,
    //   user: { id: userId },
    // });
    // user

    const res = await this.entityManager.findOne(Booking, {
      where: {
        room: { id: createBookingDto.meetingRoomId },
        startTime: LessThanOrEqual(new Date(createBookingDto.startTime)), // createBookingDto.startTime),
        endTime: MoreThanOrEqual(new Date(createBookingDto.endTime)),
      },
    });
    if (res) {
      throw new BadRequestException('该会议室该时间段已被预定');
    }

    const user = await this.entityManager.findOneBy(User, { id: userId });
    const room = await this.entityManager.findOneBy(MeetingRoom, {
      id: createBookingDto.meetingRoomId,
    });

    const booking = new Booking();
    booking.user = user;
    booking.room = room;
    booking.startTime = new Date(createBookingDto.startTime);
    booking.endTime = new Date(createBookingDto.endTime);
    booking.note = createBookingDto.note;

    await this.entityManager.save(Booking, booking);
    return 'success';
  }

  async find(
    pageNo: number,
    pageSize: number,
    username: string,
    meetingRoomName: string,
    meetingRoomPosition: string,
    bookingTimeRangeStart: number,
    bookingTimeRangeEnd: number,
  ) {
    const condition: Record<string, any> = {};
    if (username) {
      condition.user = { username: Like(`%${username}%`) };
    }
    if (meetingRoomName) {
      condition.room = {
        name: Like(`%${meetingRoomName}%`),
      };
    }

    if (meetingRoomPosition) {
      if (!condition.room) condition.room = {};
      condition.room.location = Like(`%${meetingRoomPosition}%`);
    }

    if (bookingTimeRangeStart) {
      if (!bookingTimeRangeEnd) {
        // 一小时 这么设定很奇怪啊
        bookingTimeRangeEnd = bookingTimeRangeStart + 1000 * 60 * 60;
      }

      condition.startTime = Between(
        new Date(bookingTimeRangeStart),
        new Date(bookingTimeRangeEnd),
      );
    }

    const [bookings, totalCount] = await this.entityManager.findAndCount(
      Booking,
      {
        skip: (pageNo - 1) * pageSize,
        take: pageSize,
        where: condition,
        relations: {
          user: true,
          room: true,
        },
      },
    );
    return {
      bookings: bookings.map((booking) => {
        // 删去password
        delete booking.user.password;
        return booking;
      }),
      totalCount,
    };
  }

  async apply(id: number) {
    // const booking = await this.entityManager.findOneBy(Booking, { id });
    // booking.status = '已申请';
    // await this.entityManager.save(booking);
    // 不用这么麻烦 update就行
    await this.entityManager.update(Booking, { id }, { status: '审批通过' });
    return 'success';
  }
  async reject(id: number) {
    await this.entityManager.update(Booking, { id }, { status: '审批驳回' });

    return 'success';
  }
  async unbind(id: number) {
    await this.entityManager.update(Booking, { id }, { status: '已解除' });

    return 'success';
  }

  async urge(id: number) {
    const hasredis = await this.redis.get('urge' + id);
    if (hasredis) {
      throw new BadRequestException('30分钟内只能催办一次');
    }
    this.redis.set('urge' + id, 30);
    const info = this.entityManager.findOneBy(Booking, { id });

    let adminEmail = await this.redis.get('admin_email');

    if (!adminEmail) {
      const admin = await this.entityManager.findOne(User, {
        select: { email: true },
        where: { isAdmin: true },
      });
      adminEmail = admin.email;
    }

    this.email.sendEmail({
      to: adminEmail,
      subject: '催办',
      html: `id 为 ${id} 的预定申请正在等待审批`,
    });

    return 'success';
  }
}
