import { Controller, Get, Inject, Query } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { start } from 'repl';

@Controller('statistic')
export class StatisticController {
  @Inject()
  private statisticService: StatisticService;

  @Get('userBookingCount')
  async userBookingCount(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return await this.statisticService.userBookingCount(startTime, endTime);
  }

  @Get('meetingRoomUsedCount')
  async meetingRoomUsedCount(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime,
  ) {
    return this.statisticService.meetingRoomUsedCount(startTime, endTime);
  }
}
