import { OAuthUser } from '@auth/domain/oauth-user';

export interface OAuthPort {
  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<OAuthUser>;
}
