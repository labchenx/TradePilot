import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

function toAuthUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('邮箱已被注册');
    }

    // bcrypt stores a salted one-way hash. The original password is never
    // persisted, which is the baseline rule for any auth system.
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.createUser({
      email,
      passwordHash,
      name: dto.name,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    const isPasswordValid = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    return this.buildAuthResponse(user);
  }

  async buildAuthResponse(user: AuthUser) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured.');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        userId: user.id,
        email: user.email,
      },
      {
        secret,
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as never,
      },
    );

    return {
      user: toAuthUser(user),
      accessToken,
    };
  }
}
