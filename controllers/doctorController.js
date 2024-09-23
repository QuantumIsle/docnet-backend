const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Doctor = require("../model/doctorModel");

exports.login = async (req, res) => {
  const { email, password } = req.body;

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

    // Generate an access token (valid for 1 hour)
    const accessToken = jwt.sign(
      { id: doctor._id, email: doctor.email },
      process.env.ACCESS_TOKEN,
      { expiresIn: "2h" }
    );

    // Generate a refresh token (valid for 7 days)
    const refreshToken = jwt.sign(
      { id: doctor._id, email: doctor.email },
      process.env.REFRESH_TOKEN,
      { expiresIn: "7d" }
    );

    // Save the refresh token in the doctor model
    doctor.refreshToken = refreshToken;
    await doctor.save();

    // Return the tokens and a success message
    res.status(200).json({
      accessToken,
      refreshToken,
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
    about, // New fields
    qualifications,
    professionalBackground,
    professionStartedYear,
    imageUrl,
  } = req.body;

  try {
    // Create a new doctor using the Doctor model
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
      about, // New fields
      qualifications,
      professionalBackground,
      professionStartedYear,
      imageUrl, // Optional
    });

    // If doctor is created successfully, send a response
    if (newDoctor) {
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
    // Handling different error types more gracefully
    if (error.message === "Doctor with this email already exists.") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({
      message: "Server error, unable to register doctor",
      error: error.message,
    });
  }
};

