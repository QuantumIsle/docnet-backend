// const passport = require("passport");
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const Patient = require("../model/patientModel");
// require("dotenv").config();

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: process.env.GOOGLE_CALLBACK_URL,
//     },
//     async (token, tokenSecret, profile, done) => {
//       try {
//         profile = profile._json;
//         console.log(profile);

//         let PatientData = await Patient.getPatientByGoogleId(
//            profile.sub
//         );
       

//         // Check if the user exists, if not, create a new one
//         if (!PatientData) {
//           PatientData = await new Patient({
//             firstName: profile.given_name,
//             lastName: profile.family_name,
//             email: profile.email,
//             googleId: profile.sub,
//           }).save();
//         }

//         // Pass the patient data to the done callback
//         done(null, PatientData);
//       } catch (error) {
//         console.error("Error during authentication");
//         done(error, null);
//       }
//     }
//   )
// );

// passport.serializeUser((user, done) => {
//   done(null, user.id); // Serialize user by ID
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     // Fetch the user by ID from the database
//     const user = await Patient.findOne({ googleId: id });
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
require("dotenv").config();

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: process.env.GOOGLE_CALLBACK_URL,
			scope: ["profile", "email"],
		},
		function (accessToken, refreshToken, profile, callback) {
			callback(null, profile);
		}
	)
);

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});
