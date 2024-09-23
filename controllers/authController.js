const User = require("../model/patientModel");

// Handles Google OAuth callback
exports.googleCallback = async (req, res) => {
  // Successful authentication, redirect to the frontend
  res.redirect(process.env.FRONTEND_URL);
};

// Handles user profile retrieval
exports.getProfile = (req, res) => {
  console.log(req.isAuthenticated());
  if (!req.isAuthenticated()) {
    console.log("User is not authenticated.");
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json(req.user);
};

// Handles user logout
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
};
