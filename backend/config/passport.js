const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
    scope: ['profile', 'email'],
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      if (!profile || !profile.emails || !profile.emails[0] || !profile.emails[0].value) {
        return done(new Error('No email found in Google profile'), null);
      }

      const email = profile.emails[0].value;
      
      // 1. Try to find by googleId first
      let user = await User.findOne({ googleId: profile.id });
      if (user) return done(null, user);

      // 2. Try to find by email and link accounts
      user = await User.findOne({ email });
      if (user) {
        user.googleId = profile.id;
        if (!user.avatar && profile.photos && profile.photos[0]) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
        return done(null, user);
      }

      // 3. Create new user
      const newUser = new User({
        googleId: profile.id,
        email: email,
        fullName: profile.displayName || email.split('@')[0],
        username: email.split('@')[0],
        avatar: (profile.photos && profile.photos[0]) ? profile.photos[0].value : '',
        role: 'customer',
        verified: true
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      console.error('Passport Google Strategy Error:', error);
      return done(error, null);
    }
  }
));

// Serialize user into the sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the sessions
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
