import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || '',
    });
  }

  validate(payload: {
    sub: string;
    email: string;
    name: string;
    accountType: string;
    role: string;
  }) {
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      accountType: payload.accountType,
      role: payload.role,
    };
  }
}
