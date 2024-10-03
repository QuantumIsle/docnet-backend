const passport = require("passport");
const jwt = require("jsonwebtoken");
const Patient = require("../model/patientModel");

exports.home = (req, res) => {
  res.redirect("/auth/google");
};

// Google login route
exports.googleLogin = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// Google callback route after authentication
exports.googleCallback = passport.authenticate("google", {
  failureRedirect: "/",
});

// Profile route after successful authentication
exports.profile = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }

  const { sub, given_name, family_name, picture, email } = req.user._json;

  try {
    // Check if patient already exists in the database
    let patient = await Patient.findOne({ googleId: sub });

    if (!patient) {
      // If the patient doesn't exist, create a new one
      patient = new Patient({
        firstName: given_name,
        lastName: family_name,
        googleId: sub,
        email: email,
        imgUrl: picture,
      });
      await patient.save();
    }

    // Generate an access token (valid for 2 hours)
    const accessToken = jwt.sign(
      { id: patient._id, email: patient.email },
      process.env.ACCESS_TOKEN, // Make sure the env var is named correctly
      { expiresIn: "2h" }
    );

    // Generate a refresh token (valid for 7 days)
    const refreshToken = jwt.sign(
      { id: patient._id, email: patient.email },
      process.env.REFRESH_TOKEN, // Make sure the env var is named correctly
      { expiresIn: "7d" }
    );

    // Save the refresh token in the database for the patient
    patient.refreshToken = refreshToken;
    await patient.save();

    // Option 1: Redirect with tokens as URL parameters (not very secure)
    // res.redirect(`${process.env.FRONTEND_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}`);

    // Option 2: Redirect with tokens as HttpOnly cookies (more secure)
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "Strict",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect back to frontend after successful login
    res.redirect(`${process.env.FRONTEND_URL}`);
  } catch (error) {
    console.error("Error during profile handling:", error);
    res.status(500).json({ message: "An error occurred during login." });
  }
};

// Logout route
exports.logout = (req, res, next) => {
  console.log("Logging out...");

  // Handle errors during logout (if applicable)
  req.logout((err) => {
    if (err) {
      return next(err); // Pass the error to the next middleware for proper handling
    }

    // Clear the cookies storing tokens
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: true, // Use in production
      sameSite: "None",
    });
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: true, // Use in production
      sameSite: "None",
    });

    // Send successful response or redirect to login/home
    res.status(200).json({ message: "Logged out successfully" });
  });
};

