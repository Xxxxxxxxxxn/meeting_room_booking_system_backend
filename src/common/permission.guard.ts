import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject()
  private reflector: Reflector;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    // 为啥没有user直接跳过
    if (!request.user) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride(
      'require-permission',
      [context.getClass(), context.getHandler()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const user = request.user;
    requiredPermissions.forEach((per) => {
      const hasPermission = user.permissions.find((it) => it.code === per);
      if (!hasPermission) {
        throw new UnauthorizedException('您没有访问该接口的权限');
      }
    });

    return true;
  }
}
