import { PickType } from '@nestjs/mapped-types';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { LoginUserDto } from './login-user.dto';

export class RegisterUserDto extends PickType(LoginUserDto, [
  'username',
  'password',
]) {
  // @IsNotEmpty({
  //   message: '用户名不能为空',
  // })
  // username: string;

  @IsNotEmpty({
    message: '昵称不能为空',
  })
  nickName: string;

  // @IsNotEmpty({
  //   message: '密码不能为空',
  // })
  // @MinLength(6, {
  //   message: '密码不能少于 6 位',
  // })
  // password: string;

  @IsNotEmpty({
    message: '邮箱不能为空',
  })
  @IsEmail(
    {},
    {
      message: '不是合法的邮箱格式',
    },
  )
  email: string;

  @IsNotEmpty({
    message: '验证码不能为空',
  })
  captcha: string;
}

export class UpdateUserPasswordDto extends PickType(RegisterUserDto, [
  'email',
  'captcha',
  'username',
  'password',
]) {
  // @IsNotEmpty({ message: '用户名不能为空' })
  // username: string;
  // @IsNotEmpty({
  //   message: '密码不能为空',
  // })
  // @MinLength(6, {
  //   message: '密码不能少于 6 位',
  // })
  // password: string;
  // @IsNotEmpty({ message: '密码不能为空' })
  // @IsEmail(
  //   {},
  //   {
  //     message: '不是合法的邮箱格式',
  //   },
  // )
  // email: string;
  // @IsNotEmpty({
  //   message: '验证码不能为空',
  // })
  // captcha: string;
}

export class UpdateUserDto extends PickType(RegisterUserDto, [
  'email',
  'captcha',
]) {
  headPic: string;

  nickName: string;
}
