const passport = require("passport");
const jwt = require("jsonwebtoken");
const Patient = require("../model/patientModel");
const Doctor = require("../model/doctorModel");

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
      sameSite: "Strict",
    });
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: true, // Use in production
      sameSite: "Strict",
    });

    // Send successful response or redirect to login/home
    res.status(200).json({ message: "Logged out successfully" });
  });
};

const nodemailer = require("nodemailer"); // Make sure nodemailer is installed and required

const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other email services like 'Outlook', 'Yahoo', etc.
  auth: {
    user: "mihanfernando23@gmail.com", // Replace with your email
    pass: "buyt jvvq vbdf baag", // Replace with your email password (or use App Passwords)
  },
});

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    let user;
    let userType;

    // Check if the email exists in the Doctor collection
    user = await Doctor.findOne({ email });

    if (user) {
      userType = "Doctor";
    } else {
      // If not found in Doctor, check in the Patient collection
      user = await Patient.findOne({ email });
      if (user) {
        userType = "Patient";
      }
    }

    // If neither a doctor nor a patient is found, return 404
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    // Generate OTP (4 digits)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Prepare the mail options for sending the OTP
    const mailOptions = {
      from: '"DocnetAI Support" <support@docnetai.com>', // Professional sender format
      to: email, // Receiver's email address
      subject: "Your DocnetAI Password Reset Code", // Professional subject line with company name
      text: `Dear ${user.firstName},
    
We have received a request to reset your password for your DocnetAI account. Please use the verification code below to complete the process:
    
Verification Code: ${otp}
    
For your security, this code will expire in 10 minutes. If you did not request this password reset, please disregard this email or contact our support team immediately.
    
Thank you for choosing DocnetAI.
    
Best regards,
The DocnetAI Support Team
support@docnetai.com
www.docnetai.com
`,
    };

    // Send the email with the OTP
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Failed to send email" });
      } else {
        console.log("Email sent:", info.response);

        // Return the OTP and user type (Doctor or Patient) as part of the response
        return res.json({ otp, userType });
      }
    });
  } catch (error) {
    console.error("Error during password reset process:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.changePassword = async (req, res) => {
  const { email, userType, newPassword } = req.body;
  console.log(req.body);

  try {
    // Check if the user is a doctor or patient based on userType
    let user;
    if (userType === "Doctor") {
      user = await Doctor.findOne({ email });
    } else if (userType === "Patient") {
      user = await Patient.findOne({ email });
    }
    console.log(user);

    // If user not found, return an error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's password in the database
    user.password = newPassword;

    // Save the updated user with the new password
    await user.save();

    // Respond with success message
    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error during password change process:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
