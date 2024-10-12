import { Module } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { UserModule } from 'src/user/user.module';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [UserModule],
  providers: [LocalStrategy, GoogleStrategy],
})
export class AuthModule {}
