import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { findOrCreateGoogleUser, GoogleProfile } from '../services/auth';

export function configurePassport(): void {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL =
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:4000/api/auth/google/callback';

  if (!clientID || !clientSecret) {
    console.warn(
      'Google OAuth credentials not configured. Google authentication will be disabled.'
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['profile', 'email'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (error: Error | null, user?: Express.User | false) => void
      ) => {
        try {

          const googleProfile: GoogleProfile = {
            id: profile.id,
            displayName: profile.displayName,
            emails: profile.emails,
            photos: profile.photos,
          };

          const user = await findOrCreateGoogleUser(googleProfile);
          done(null, user);
        } catch (error) {
          console.error('Google OAuth error in strategy callback:', error);
          done(null, false);
        }
      }
    )
  );
}

export default passport;
