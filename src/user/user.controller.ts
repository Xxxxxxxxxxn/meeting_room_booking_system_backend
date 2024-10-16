import {
  RequireLogin,
  RequirePermission,
  UserInfo,
} from '../common/custom.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpStatus,
  Inject,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import {
  RegisterUserDto,
  UpdateUserDto,
  UpdateUserPasswordDto,
} from './dto/user.dto';
import { EmailService } from '../email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { LoginUserDto } from './dto/login-user.dto';
import { ConfigService } from '@nestjs/config';
import { UserDetailVo } from './vo/user-info';
import { generateParseIntPipe } from 'src/common/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { storage } from 'src/my-file-storage';
import { AuthGuard } from '@nestjs/passport';
import { LoginUserVo } from './vo/login-user.vo';
import { Response } from 'express';
@Controller('user')
export class UserController {
  @Inject()
  private userService: UserService;
  @Inject()
  private emailService: EmailService;
  @Inject()
  private redisService: RedisService;
  @Inject()
  private jwtService: JwtService;

  @Inject(ConfigService)
  private configService: ConfigService;

  @Get('init-data')
  async initData() {
    await this.userService.initData();
    return 'done';
  }

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  @Get('register-captcha')
  async registerCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);
    const expireTime = 60 * 5;
    await this.redisService.set(
      'captcha_' + address,
      code,
      // 不做限制了 麻烦
      expireTime,
    );
    await this.emailService.sendEmail({
      to: address,
      subject: '注册验证码',
      html: `<p>验证码为: ${code}，5分钟内有效</p>`,
    });
    return '发送成功';
  }

  // 忘记密码验证码
  @Get('update_password/captcha')
  async updatePasswordCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `captcha_${address}`,
      code,
      // 不做限制了 麻烦
      // 10 * 60,
    );

    await this.emailService.sendEmail({
      to: address,
      subject: '更改密码验证码',
      html: `<p>你的更改密码验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  // 修改个人信息验证吗
  @Get('/update/captcha')
  @RequireLogin()
  async updateCaptcha(@UserInfo('email') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `captcha_${address}`,
      code,
      // 不做限制了 麻烦
      // 10 * 60,
    );

    await this.emailService.sendEmail({
      to: address,
      subject: '更改用户信息验证码',
      html: `<p>你的更改用户信息验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: 'uploads',
      storage: storage,
      limits: { fileSize: 1024 * 1024 * 3 },
      // 做下文件类型限制
      fileFilter(req, file, callback) {
        const existName = path.extname(file.originalname);
        if (['.png', '.jpg', '.jpeg', 'gif'].includes(existName)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('只能上传图片'), false);
        }
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    return file.path;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async google() {}

  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
    if (!req.user) {
      throw new BadRequestException('google 登录失败');
    }

    const foundUser = await this.userService.findUserByEmail(req.user.email);

    if (foundUser) {
      const vo = new LoginUserVo();
      vo.userInfo = {
        id: foundUser.id,
        username: foundUser.username,
        nickName: foundUser.nickName,
        email: foundUser.email,
        phoneNumber: foundUser.phoneNumber,
        headPic: foundUser.headPic,
        createTime: foundUser.createTime.getTime(),
        isFrozen: foundUser.isFrozen,
        isAdmin: foundUser.isAdmin,
        roles: foundUser.roles.map((item) => item.name),
        permissions: foundUser.roles.reduce((arr, item) => {
          item.permissions.forEach((permission) => {
            if (arr.indexOf(permission) === -1) {
              arr.push(permission);
            }
          });
          return arr;
        }, []),
      };
      vo.accessToken = this.jwtService.sign(
        {
          userId: vo.userInfo.id,
          username: vo.userInfo.username,
          email: vo.userInfo.email,
          roles: vo.userInfo.roles,
          permissions: vo.userInfo.permissions,
        },
        {
          expiresIn:
            this.configService.get('jwt_access_token_expires_time') || '30m',
        },
      );

      vo.refreshToken = this.jwtService.sign(
        {
          userId: vo.userInfo.id,
        },
        {
          expiresIn:
            this.configService.get('jwt_refresh_token_expres_time') || '7d',
        },
      );

      // return vo;

      res.cookie('userInfo', JSON.stringify(vo.userInfo));
      res.cookie('accessToken', vo.accessToken);
      res.cookie('refreshToken', vo.refreshToken);
      res.redirect('http://localhost:3000/');
      return;
    }

    const user = await this.userService.registerByGoogleInfo(
      req.user.email,
      req.user.firstName + ' ' + req.user.lastName,
      req.user.picture,
    );

    const vo = new LoginUserVo();
    vo.userInfo = {
      id: user.id,
      username: user.username,
      nickName: user.nickName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      headPic: user.headPic,
      createTime: user.createTime.getTime(),
      isFrozen: user.isFrozen,
      isAdmin: user.isAdmin,
      roles: [],
      permissions: [],
    };

    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        email: vo.userInfo.email,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      },
      {
        expiresIn:
          this.configService.get('jwt_access_token_expires_time') || '30m',
      },
    );

    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expres_time') || '7d',
      },
    );

    res.cookie('userInfo', JSON.stringify(vo.userInfo));
    res.cookie('accessToken', vo.accessToken);
    res.cookie('refreshToken', vo.refreshToken);
    res.redirect('http://localhost:3000/');
    // return vo;
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async userLogin(@UserInfo() vo: LoginUserVo) {
    // const vo = await this.userService.login(loginUser, false);

    // 设置jwt签名
    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        email: vo.userInfo.email,
        isAdmin: vo.userInfo.isAdmin,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      },
      // TODO:暂时不要过期时间
      // {
      //   expiresIn:
      //     this.configService.get('jwt_access_token_expires_time') || '30m',
      // },
    );
    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expres_time') || '7d',
      },
    );
    return vo;
  }

  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    return this.userService.login(loginUser, true);
  }

  // 写一个刷新jwt的接口
  @Get('refresh')
  async refreshToken(@Query('refreshToken') refreshToken: string) {
    try {
      const user = this.jwtService.verify(refreshToken);
      const userinfo = await this.userService.findUserById(user.id, false);
      const access_token = this.jwtService.sign(
        {
          userId: userinfo.id,
          username: userinfo.username,
          email: userinfo.email,
          roles: userinfo.roles,
          permissions: userinfo.permissions,
        },
        {
          expiresIn:
            this.configService.get('jwt_access_token_expires_time') || '30m',
        },
      );

      const refresh_token = this.jwtService.sign(
        {
          userId: user.id,
        },
        {
          expiresIn:
            this.configService.get('jwt_refresh_token_expres_time') || '7d',
        },
      );

      return {
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  @Get('admin/refresh')
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);

      const user = await this.userService.findUserById(data.userId, true);

      const access_token = this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
        },
        {
          expiresIn:
            this.configService.get('jwt_access_token_expires_time') || '30m',
        },
      );

      const refresh_token = this.jwtService.sign(
        {
          userId: user.id,
        },
        {
          expiresIn:
            this.configService.get('jwt_refresh_token_expres_time') || '7d',
        },
      );

      return {
        access_token,
        refresh_token,
      };
    } catch (e) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  @Get('info')
  @RequireLogin()
  async info(@UserInfo('userId') userId: number) {
    const user = await this.userService.findUserDetailById(userId);
    const vo = new UserDetailVo();
    vo.id = user.id;
    vo.email = user.email;
    vo.username = user.username;
    vo.headPic = user.headPic;
    vo.phoneNumber = user.phoneNumber;
    vo.nickName = user.nickName;
    vo.createTime = user.createTime;
    vo.isFrozen = user.isFrozen;

    return vo;
  }

  @Post(['update_password', 'admin/update_password'])
  @RequireLogin()
  async updatePassword(@Body() passwordDto: UpdateUserPasswordDto) {
    const res = await this.userService.updatePassword(passwordDto);
    this.redisService.del(`captcha_${passwordDto.email}`);
    return res;
  }

  @Post(['update', 'admin/update'])
  @RequireLogin()
  async update(
    @UserInfo('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const res = await this.userService.update(userId, updateUserDto);
    this.redisService.del(`captcha_${updateUserDto.email}`);

    return res;
  }

  @Get('frozen')
  async frozen(
    @Query('id', ParseIntPipe) id: number,
    @Query('isFrozen') isFrozen: string,
  ) {
    return await this.userService.frozen(id, isFrozen);
  }

  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(2),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Query('username') username?: string,
    @Query('nickName') nickName?: string,
    @Query('email') email?: string,
  ) {
    return await this.userService.findUsers(
      pageNo,
      pageSize,
      email,
      nickName,
      username,
    );
  }
}
