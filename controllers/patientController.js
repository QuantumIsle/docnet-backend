const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Patient = require("../model/patientModel");
const UpcomingAppointment = require("../model/appointments/UpcomingAppointmentModel");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const mongoose = require("mongoose");

// Registers a new patient
exports.register = async (req, res) => {
  const { firstName, lastName, dateOfBirth, gender, email, password } =
    req.body;

  console.log(req.body);

  try {
    // Create a new patient using the Patient model
    const patient = await Patient.addPatient({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      password,
    });

    // If patient is created successfully, send response
    const accessToken = jwt.sign(
      { id: patient._id, email: patient.email },
      process.env.ACCESS_TOKEN,
      { expiresIn: "2h" }
    );

    // Generate a refresh token (valid for 7 days)
    const refreshToken = jwt.sign(
      { id: patient._id, email: patient.email },
      process.env.REFRESH_TOKEN,
      { expiresIn: "7d" }
    );

    // Save the refresh token in the database for the patient
    patient.refreshToken = refreshToken;
    await patient.save();

    // Return the tokens and a success message
    res.status(200).json({
      accessToken,
      refreshToken,
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

// Logs in a patient and returns access and refresh tokens
exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  try {
    // Find the patient by email
    const patient = await Patient.findOne({ email });

    // If patient is not found, return an error
    if (!patient) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, patient.password);

    // If passwords don't match, return an error
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate an access token (valid for 1 hour)
    const accessToken = jwt.sign(
      { id: patient._id, email: patient.email },
      process.env.ACCESS_TOKEN,
      { expiresIn: "2h" }
    );

    // Generate a refresh token (valid for 7 days)
    const refreshToken = jwt.sign(
      { id: patient._id, email: patient.email },
      process.env.REFRESH_TOKEN,
      { expiresIn: "7d" }
    );

    // Save the refresh token in the database for the patient
    patient.refreshToken = refreshToken;
    await patient.save();

    // Return the tokens and a success message
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "None",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(200).json({ message: "Logged in" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Refreshes the access token using the refresh token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies.refresh_token;

  // Check if a refresh token is provided
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    // Verify the provided refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);

    // Find the patient by decoded ID
    const patient = await Patient.findById(decoded.id);

    // Check if the patient exists and if the refresh token matches
    if (!patient || patient.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate a new access token (valid for 1 hour)
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

    // Return the new tokens
    res.cookie("access_token", newAccessToken, {
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
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token", error });
  }
};
exports.checkAuth = (req, res) => {
  // Check if the user is authenticated based on the JWT in the cookies
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    // Verify the access token
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);

    if (decoded) {
      return res.status(200).json({ message: "Authenticated" });
    } else {
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
// Authenticates a patient for booking purposes

dayjs.extend(utc);
dayjs.extend(timezone);
const Doctor = require("../model/doctorModel");

exports.booking = async (req, res) => {
  const { docId, date, time } = req.body; // Extract docId, date, and time from the request body
  const user = req.user; // Get the authenticated user (assuming user is authenticated and available in req.user)

  console.log(user);
  console.log(req.body);

  try {
    // Check if the doctor ID, date, and time are provided
    if (!docId || !date || !time) {
      return res
        .status(400)
        .json({ error: "All fields (docId, date, time) are required." });
    }

    // Parse the date and time into a single Date object in the desired time zone
    const appointmentDate = dayjs.tz(
      `${date} ${time}`,
      "YYYY-MM-DD HH:mm",
      "UTC"
    );

    console.log(appointmentDate.toString()); // This will log the correct time in UTC

    // Check if the appointment date is valid and not in the past
    if (!appointmentDate.isValid() || appointmentDate.isBefore(dayjs())) {
      return res
        .status(400)
        .json({ error: "Invalid appointment date or time." });
    }

    // Create the new appointment object
    const newAppointment = new UpcomingAppointment({
      docId: new mongoose.Types.ObjectId(docId), // Use `new` to instantiate ObjectId
      patientId: new mongoose.Types.ObjectId(user), // Use `new` for ObjectId here too
      date: appointmentDate.toDate(), // Convert back to JavaScript Date object for storage
    });

    console.log(newAppointment);

    // Save the appointment to the database
    const savedAppointment = await newAppointment.save();

    await Patient.addUpcomingAppointment(user, savedAppointment._id);

    // Return a success response with the saved appointment details
    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment: savedAppointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while booking the appointment" });
  }
};
