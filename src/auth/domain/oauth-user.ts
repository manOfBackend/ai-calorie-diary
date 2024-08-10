export interface OAuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  provider: string;
  providerId: string;
  profilePicture?: string;
}
