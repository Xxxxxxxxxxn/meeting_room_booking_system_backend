import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  RequireLogin,
  RequirePermission,
  UserInfo,
} from './common/custom.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('aaa')
  // @SetMetadata('require-login', true)
  // @SetMetadata('require-permission', ['ccc'])
  @RequireLogin()
  @RequirePermission()
  aaaa(@UserInfo('username') username, @UserInfo() UserInfo) {
    return 'aaa';
  }

  @Get('bbb')
  bbb() {
    return 'bbb';
  }
}
