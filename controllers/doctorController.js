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
    res.cookie('accessToken', accessToken, {
      httpOnly: true,   // Secure flag should be added for production
      secure: process.env.NODE_ENV === 'production',
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      sameSite: 'Strict',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'Strict',
    });

    // Return the tokens in response as well, if you want to access them in the frontend
    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
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
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
        sameSite: 'Strict',
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'Strict',
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


