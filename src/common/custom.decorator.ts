import {
  ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Request } from 'express';
// 挺有意思 抛出函数就可以当做装饰器了 不过也确实函数本来就可以当装饰器
// 必须大写吗 不用非得大写  知识大写好看点
export const RequireLogin = () => SetMetadata('require-login', true);

export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('require-permission', permissions);

// 创建参数装饰器 guard中从auth参数解析出user信息，传到这里。外层传入想要获取的信息，不传给全部user信息
export const UserInfo = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    // 从guard 透传下的user
    if (!request.user) {
      return null;
    }
    // 有key就给key值 没key给全部user值
    return data ? request.user[data] : request.user;
  },
);
