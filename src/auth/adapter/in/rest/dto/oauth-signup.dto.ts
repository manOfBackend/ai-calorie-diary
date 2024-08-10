import { IsEmail, IsString, IsOptional } from 'class-validator';
import { OAuthUser } from '@auth/domain/oauth-user';

export class OAuthSignupDto implements OAuthUser {
  @IsEmail()
  email: string;

  @IsString()
  provider: string;

  @IsString()
  providerId: string;

  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;
}
