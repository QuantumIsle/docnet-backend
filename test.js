
// const express = require("express");
// const passport = require("passport");
// const session = require("express-session");
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// require("dotenv").config();
// const app = express();

// // Initialize session
// app.use(
//   session({
//     secret: "your_secret_key",
//     resave: false,
//     saveUninitialized: true,
//   })
// );

// // Initialize passport
// app.use(passport.initialize());
// app.use(passport.session());

// // Passport session setup (serialize/deserialize user)
// passport.serializeUser((user, done) => {
//   done(null, user);
// });

// passport.deserializeUser((user, done) => {
//   done(null, user);
// });

// // Use Google Strategy
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:4000/auth/callback",
//     },
//     (accessToken, refreshToken, profile, done) => {
//       // Here, you would save the user profile in the database if necessary
//       return done(null, profile);
//     }
//   )
// );

// // Routes
// app.get("/", (req, res) => {
//   res.send('<h1>Home</h1><a href="/auth/google">Authenticate with Google</a>');
// });

// // Redirect to Google for authentication
// app.get(
//   "/auth/google",
//   passport.authenticate("google", {
//     scope: ["profile", "email"],
//   })
// );

// // Google callback after authentication
// app.get(
//   "/auth/callback",
//   passport.authenticate("google", { failureRedirect: "/" }),
//   (req, res) => {
//     res.redirect("/profile");
//   }
// );

// // Profile page after successful authentication
// app.get("/profile", (req, res) => {
//   if (!req.isAuthenticated()) {
//     return res.redirect("/");
//   }
//   console.log(req.user);

//   res.send(
//     `<h1>Welcome ${req.user.displayName}</h1><a href="/logout">Logout</a>`
//   );
// });

// // Logout route
// app.get("/logout", (req, res) => {
//   req.logout((err) => {
//     if (err) {
//       return next(err);
//     }
//     res.redirect("/");
//   });
// });

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
// testTimeZones.js
const moment = require('moment-timezone');

// Get all available time zones
const timeZones = moment.tz.names();

// Output the list of time zones
console.log("Available Time Zones:");
timeZones.forEach((tz, index) => {
  console.log(`${index + 1}. ${tz}`);
});

// Optionally, you can display the count of time zones
console.log(`\nTotal Time Zones: ${timeZones.length}`);
