const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Doctor = require("../model/doctorModel");

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  try {
    // Find the doctor by email
    const doctor = await Doctor.findOne({ email });

    // If doctor is not found, return an error
    if (!doctor) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, doctor.password);

    // If passwords don't match, return an error
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate access and refresh tokens
    const accessToken = jwt.sign(
      { id: doctor._id, email: doctor.email },
      process.env.ACCESS_TOKEN,
      { expiresIn: "2h" }
    );

    const refreshToken = jwt.sign(
      { id: doctor._id, email: doctor.email },
      process.env.REFRESH_TOKEN,
      { expiresIn: "7d" }
    );

    // Save the refresh token in the doctor model
    doctor.refreshToken = refreshToken;
    await doctor.save();

    // Set cookies for accessToken and refreshToken
    res.cookie("access_token", accessToken, {
      httpOnly: true, // Secure flag should be added for production
      secure: true,
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      sameSite: "Strict",
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "Strict",
    });

    // Return the tokens in response as well, if you want to access them in the frontend
    res.status(200).json({
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.register = async (req, res) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    email,
    password,
    specialization,
    contactNumber,
    education,
    languagesSpoken,
    about,
    qualifications,
    professionalBackground,
    professionStartedYear,
    imageUrl,
  } = req.body;

  try {
    // Create a new doctor
    const newDoctor = await Doctor.addDoctor({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      password,
      specialization,
      contactNumber,
      education,
      languagesSpoken,
      about,
      qualifications,
      professionalBackground,
      professionStartedYear,
      imageUrl,
    });

    if (newDoctor) {
      // Generate access and refresh tokens
      const accessToken = jwt.sign(
        { id: newDoctor._id, email: newDoctor.email },
        process.env.ACCESS_TOKEN,
        { expiresIn: "2h" }
      );

      const refreshToken = jwt.sign(
        { id: newDoctor._id, email: newDoctor.email },
        process.env.REFRESH_TOKEN,
        { expiresIn: "7d" }
      );

      // Set cookies for accessToken and refreshToken
      res.cookie("access_Token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
        sameSite: "Strict",
      });

      res.cookie("refresh_Token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "Strict",
      });

      // Respond with a success message
      res.status(201).json({
        message: "Doctor registered successfully",
        doctor: {
          id: newDoctor._id,
          firstName: newDoctor.firstName,
          lastName: newDoctor.lastName,
          specialization: newDoctor.specialization,
          contactNumber: newDoctor.contactNumber,
          email: newDoctor.email,
          about: newDoctor.about,
          qualifications: newDoctor.qualifications,
          professionalBackground: newDoctor.professionalBackground,
          professionStartedYear: newDoctor.professionStartedYear,
          rating: newDoctor.rating,
          languagesSpoken: newDoctor.languagesSpoken,
          imageUrl: newDoctor.imageUrl,
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error, unable to register doctor",
      error: error.message,
    });
  }
};

exports.authMiddleware = async (req, res) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;


  // Check if access token exists and is valid
  if (accessToken) {
    try {
      // Verify the access token
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);

      if (decoded) {
        return res.status(200).json({ message: "Authenticated" });
      } else {
        return res.status(401).json({ message: "Invalid token" });
      }
    } catch (error) {
      // Access token is invalid or expired, try refreshing the token
      console.log("Access token expired or invalid");
    }
  }

  // No access token or invalid access token, attempt to refresh the token
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    // Verify the provided refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);

    // Find the patient by decoded ID
    const doctor = await Doctor.findById(decoded.id);

    // Check if the patient exists and if the refresh token matches
    if (!patient || patient.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate a new access token (valid for 2 hours)
    const newAccessToken = jwt.sign(
      { id: patient._id, email: patient.email },
      process.env.ACCESS_TOKEN,
      { expiresIn: "2h" }
    );

    // Optionally generate a new refresh token (valid for 7 days)
    const newRefreshToken = jwt.sign(
      { id: patient._id, email: patient.email },
      process.env.REFRESH_TOKEN,
      { expiresIn: "7d" }
    );

    // Update the patient's refresh token in the database
    patient.refreshToken = newRefreshToken;
    await patient.save();

    // Set new access and refresh tokens in cookies
    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "Strict",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({ message: "Token refreshed successfully" });
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token", error });
  }
};
