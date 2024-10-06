const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Patient = require("../model/patientModel");
const UpcomingAppointment = require("../model/appointments/UpcomingAppointmentModel");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const mongoose = require("mongoose");
const { sendEmail } = require("./emailController");
// Registers a new patient
exports.register = async (req, res) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    email,
    password,
    timeZone,
  } = req.body;


  try {
    // Create a new patient using the Patient model
    const patient = await Patient.addPatient({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      password,
      timeZone,
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
  const { docId, date, time } = req.body;
  const user = req.user;

  try {
    // Validate inputs
    if (!docId || !date || !time) {
      return res
        .status(400)
        .json({ error: "All fields (docId, date, time) are required." });
    }

    // Fetch doctor and patient data
    const doctorData = await Doctor.findById(docId);
    const patientData = await Patient.findById(user);

    if (!doctorData || !patientData) {
      return res.status(404).json({ error: "Doctor or Patient not found." });
    }

    // Use the doctor's timezone to convert the appointment time
    const appointmentDate = dayjs.tz(
      `${date} ${time}`,
      "YYYY-MM-DD HH:mm",
      "UTC"
    );

    // Check if the appointment is valid and not in the past
    if (!appointmentDate.isValid() || appointmentDate.isBefore(dayjs())) {
      return res
        .status(400)
        .json({ error: "Invalid appointment date or time." });
    }

    // Convert the appointment time to the doctor's timezone
    const doctorTimezone = doctorData.timezone || "UTC"; // Default to UTC if timezone is not set
    const appointmentInDoctorTimezone = appointmentDate.tz(doctorTimezone);

    // Create the appointment
    const newAppointment = new UpcomingAppointment({
      docId: new mongoose.Types.ObjectId(docId),
      patientId: new mongoose.Types.ObjectId(user),
      date: appointmentDate.toDate(),
    });

    // Save the appointment to the database
    const savedAppointment = await newAppointment.save();

    // Add the appointment references in the doctor and patient models
    await Patient.addUpcomingAppointment(user, savedAppointment._id);
    await Doctor.addUpcomingAppointment(docId, savedAppointment._id);

    // Send confirmation emails to both patient and doctor
    const patientEmailContent = `
      Dear ${patientData.firstName},

      Your appointment with Dr. ${doctorData.firstName} ${
      doctorData.lastName
    } has been successfully booked.
      Appointment Details:
      - Date: ${appointmentDate.format("YYYY-MM-DD")}
      - Time: ${appointmentDate.format("HH:mm")} (UTC)

      Thank you for choosing our service.
      Best regards,
      The DocnetAI Support Team
    `;

    const doctorEmailContent = `
      Dear Dr. ${doctorData.firstName} ${doctorData.lastName},

      You have a new appointment with ${patientData.firstName} ${
      patientData.lastName
    }.
      Appointment Details:
      - Date: ${appointmentInDoctorTimezone.format("YYYY-MM-DD")}
      - Time: ${appointmentInDoctorTimezone.format("HH:mm")} (${doctorTimezone})

      Please ensure to be available at the scheduled time.
      Best regards,
      The DocnetAI Support Team
    `;

    // Send the emails
    await sendEmail(
      patientData.email,
      "Appointment Confirmation",
      patientEmailContent
    );
    await sendEmail(
      doctorData.email,
      "New Appointment Confirmation",
      doctorEmailContent
    );

    // Return success response
    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment: savedAppointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return res.status(500).json({
      error: "An error occurred while booking the appointment",
    });
  }
};

const fs = require("fs");
const { google } = require("googleapis");
const multer = require("multer");
// Setup multer to handle file upload
const upload = multer({ dest: "uploads/" }); // Save files to the 'uploads' directory

const apikeys = require("./token.json");
const SCOPE = ["https://www.googleapis.com/auth/drive"];

// A Function that can provide access to google drive api
async function authorize() {
  const jwtClient = new google.auth.JWT(
    apikeys.client_email,
    null,
    apikeys.private_key,
    SCOPE
  );

  await jwtClient.authorize();

  return jwtClient;
}

// A Function that will upload the desired file to google drive folder
async function uploadFile(authClient, filePath, fileName) {
  return new Promise((resolve, reject) => {
    const drive = google.drive({ version: "v3", auth: authClient });

    const fileMetaData = {
      name: fileName, // Set file name from the request
      parents: ["1wAobbjcMFobmXRpaInTc20o19NJZVJz1"], // Folder ID where the file will be uploaded
    };

    const media = {
      body: fs.createReadStream(filePath), // Read the file from file system
      mimeType: "application/pdf", // Set MIME type for PDF
    };

    drive.files.create(
      {
        resource: fileMetaData,
        media: media,
        fields: "id",
      },
      function (error, file) {
        if (error) {
          return reject(error);
        }
        resolve(file.data.id); // Return file ID after successful upload
      }
    );
  });
}

// A Function to set file permissions to be shareable
async function setFilePublic(authClient, fileId) {
  const drive = google.drive({ version: "v3", auth: authClient });
  return new Promise((resolve, reject) => {
    drive.permissions.create(
      {
        fileId: fileId,
        resource: {
          role: "reader", // Set permission to reader
          type: "anyone", // Accessible by anyone
        },
      },
      function (error, permission) {
        if (error) {
          return reject(error);
        }
        resolve(fileId); // Return the file ID again for the next step
      }
    );
  });
}

// A Function to get the shareable link
async function getShareableLink(authClient, fileId) {
  const drive = google.drive({ version: "v3", auth: authClient });
  return new Promise((resolve, reject) => {
    drive.files.get(
      {
        fileId: fileId,
        fields: "webViewLink", // Retrieve the link to view the file
      },
      function (error, file) {
        if (error) {
          return reject(error);
        }
        resolve(file.data.webViewLink); // Return the web link
      }
    );
  });
}

// API to handle file upload from front-end
const Report = require("./../model/reportsModel");

exports.reportUpload = async (req, res) => {
  try {
    // Extract the user (doctor or patient) and reportId from the request
    const userId = req.user; // Assuming the user info comes from middleware
    const { reportId } = req.body; // Assuming reportId is sent in the body

    if (!reportId) {
      return res.status(400).json({ message: "Report ID is required" });
    }

    const { file } = req;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { originalname, path } = file;
    console.log(`File received: ${originalname} for report ID: ${reportId}`);

    // Authenticate Google Drive
    const authClient = await authorize();

    // Upload the file to Google Drive
    const fileId = await uploadFile(authClient, path, originalname);

    // Set file permission to public
    await setFilePublic(authClient, fileId);

    // Get the shareable link
    const shareableLink = await getShareableLink(authClient, fileId);

    // Find the report by reportId
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Update the report with the new file URL and status
    report.fileUrl = shareableLink; // Set the file URL
    report.status = "Completed"; // Update the status to "Completed" (or other relevant status)

    // Save the updated report to the database
    await report.save();

    // Respond with the updated report data and shareable link
    res.status(200).json({
      message: "File uploaded and report updated successfully",
      link: shareableLink,
    });
  } catch (error) {
    console.error("Error uploading file and updating report:", error);
    res.status(500).json({ message: "Error uploading file", error });
  } finally {
    // Clean up the uploaded file
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path); // Delete the file from 'uploads' after processing
    }
  }
};

// Middleware to handle file upload
exports.uploadMiddleware = upload.single("file"); // 'file' is the field name expected in the form data

const Review = require("../model/review/review");

exports.addReview = async (req, res) => {
  const { doctor, rating, comment } = req.body;
  const user = req.user;

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
