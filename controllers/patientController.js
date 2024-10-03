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
    // Return the tokens and a success message
    res.status(200).json({
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

// Logs in a patient and returns access and refresh tokens
exports.login = async (req, res) => {
  const { email, password } = req.body;

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
    const patient = await Patient.findById(decoded.id);

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

// Authenticates a patient for booking purposes

dayjs.extend(utc);
dayjs.extend(timezone);
const Doctor = require("../model/doctorModel");

exports.booking = async (req, res) => {
  const { docId, date, time } = req.body; // Extract docId, date, and time from the request body
  const user = req.user; // Get the authenticated user (assuming user is authenticated and available in req.user)

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

    // Save the appointment to the database
    const savedAppointment = await newAppointment.save();

    await Patient.addUpcomingAppointment(user, savedAppointment._id);
    await Doctor.addUpcomingAppointment(docId, savedAppointment.id);
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

const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cloudinary configuration
cloudinary.config({
  cloud_name: "dwdymcrq9", // Replace with your Cloudinary cloud name
  api_key: "937769557958765", // Replace with your Cloudinary API key
  api_secret: "66ODAF768PrBgMQ5ESWr1_MRCf0", // Replace with your Cloudinary API secret
});

// Set up Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", // Folder name in Cloudinary where files will be uploaded
    format: async (req, file) => {
      const formats = ["jpg", "jpeg", "png", "pdf"];
      const extension = file.mimetype.split("/")[1];
      return formats.includes(extension) ? extension : "jpg";
    },
    public_id: (req, file) => "report-" + Date.now(),
  },
});

// Initialize the multer upload middleware
const upload = multer({ storage: storage });

// Define the reportUpload method using Cloudinary
exports.reportUpload = async (req, res) => {
  upload.single("report")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).send({ message: err.message });
    } else if (err) {
      return res.status(500).send({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    // File successfully uploaded to Cloudinary
    res.status(200).send({
      message: "File uploaded successfully",
      fileUrl: req.file.path, // Cloudinary URL of the uploaded file
      public_id: req.file.filename, // Cloudinary public ID of the file
    });
  });
};

const Review = require("../model/review/review"); 
exports.addReview = async (req, res) => {
  const { doctor, user, rating, comment } = req.body;

  try {
    // Check if all necessary fields are provided
    if (!doctor || !user || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create the review data object
    const reviewData = {
      doctor,
      user,
      rating,
      comment,
    };

    // Call the addReview method from the Review model
    const newReview = await Review.addReview(reviewData);

    res.status(201).json({ message: "Review added successfully", newReview });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
