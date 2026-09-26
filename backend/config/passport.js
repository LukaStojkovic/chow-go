import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { readOAuthState } from "../utils/googleHandoff.js";
import "./env.js";


function getGoogleProfilePicture(profile) {
  const photo = profile.photos?.[0]?.value;
  if (!photo) return "";
  return photo.replace("=s96-c", "=s400-c");
}

export async function resolveGoogleProfile(profile) {
  const email = profile.emails?.[0]?.value?.trim().toLowerCase();
  const emailVerified =
    profile.emails?.[0]?.verified === true ||
    profile._json?.email_verified === true;
  const googleId = profile.id;
  const profilePicture = getGoogleProfilePicture(profile);
  const name = profile.displayName;

  const user = await User.findOne({ googleId });
  if (user) {
    if (profilePicture && user.profilePicture !== profilePicture) {
      user.profilePicture = profilePicture;
      await user.save();
    }
    return { user };
  }

  if (!email || !emailVerified) return { failure: "email_unverified" };

  // Linking by email alone let anyone who registered the address first
  // share the account with its real owner.
  if (await User.exists({ email })) return { failure: "account_exists" };

  return {
    user: {
      isNewUser: true,
      googleProfile: { googleId, email, name, profilePicture },
    },
  };
}

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // A link is for the account already signed in, whose email is
          // bound to exist, so it must not go through the sign-in lookup.
          if (readOAuthState(req.query.state).link) {
            return done(null, { linkProfile: { googleId: profile.id } });
          }
          const { user, failure } = await resolveGoogleProfile(profile);
          return user ? done(null, user) : done(null, false, { reason: failure });
        } catch (error) {
          return done(error, null);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    if (user.isNewUser) {
      done(null, user);
    } else {
      done(null, user._id);
    }
  });

  passport.deserializeUser(async (idOrUser, done) => {
    try {
      if (idOrUser.isNewUser) {
        return done(null, idOrUser);
      }
      const user = await User.findById(idOrUser);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}
