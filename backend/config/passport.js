import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

function getGoogleProfilePicture(profile) {
  const photo = profile.photos?.[0]?.value;
  if (!photo) return "";
  return photo.replace("=s96-c", "=s400-c");
}

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const profilePicture = getGoogleProfilePicture(profile);
          const name = profile.displayName;

          let user = await User.findOne({ googleId });
          if (user) {
            if (profilePicture && user.profilePicture !== profilePicture) {
              user.profilePicture = profilePicture;
              await user.save();
            }
            return done(null, user);
          }

          user = await User.findOne({ email });
          if (user) {
            user.googleId = googleId;
            if (profilePicture && !user.profilePicture) {
              user.profilePicture = profilePicture;
            }
            await user.save();
            return done(null, user);
          }

          return done(null, {
            isNewUser: true,
            googleProfile: { googleId, email, name, profilePicture },
          });
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
