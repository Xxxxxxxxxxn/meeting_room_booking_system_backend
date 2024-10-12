import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

import { SocksProxyAgent } from 'socks-proxy-agent';
const agent = new SocksProxyAgent(
  'socks5://127.0.0.1:7897' || 'socks5://127.0.0.1:7890',
);

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get('login_client_id'),
      clientSecret: configService.get('login_client_secret'),
      callbackURL: configService.get('login_callback_url'),
      scope: ['email', 'profile'],
      // proxy: true,
    });

    this._oauth2.setAgent(agent);
  }

  validate(accessToken: string, refreshToken: string, profile: any) {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
    };
    return user;
  }
}
