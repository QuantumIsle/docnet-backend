const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Doctor = require("../model/doctorModel");
const Patient = require("../model/patientModel");

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
    console.log(isMatch);

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
  console.log(req.body);

  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    email,
    password,
    timeZone,
    phoneNumber,
    country,
  } = req.body;

  try {
    // Create a new patient using the Patient model
    const newDoctor = await Doctor.addDoctor({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      password,
      timeZone,
      contactNumber: phoneNumber,
      country,
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
      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
        sameSite: "Strict",
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "Strict",
      });

      // Respond with a success message
      res.status(200).json({
        message: "Doctor registered successfully",
      });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error, unable to register doctor",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const id = req.user;

  try {
    // Find the patient by ID
    const doctor = await Doctor.findOne({ _id: id });

    // Check if patient exists
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Compare the old password with the hashed password in the database
    const isMatch = await bcrypt.compare(currentPassword, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Update the patient's password
    doctor.password = newPassword;
    await doctor.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error", error });
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
    if (!doctor || doctor.refreshToken !== refreshToken) {
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
    doctor.refreshToken = newRefreshToken;
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

const Report = require("../model/reportsModel"); // Import the Report model

// API handler for reviewing a report
exports.reviewReport = async (req, res) => {
  try {
    const { reportId, review } = req.body;

    // Validate required fields
    if (!reportId || !review) {
      return res
        .status(400)
        .json({ message: "Report ID and review are required." });
    }

    // Find the report by ID and update the review and status
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    // Update the report with the review and change status to "Reviewed"
    report.review = review;
    report.status = "Reviewed";

    // Save the updated report
    await report.save();

    return res.status(200).json({
      message: "Review submitted successfully.",
      report,
    });
  } catch (error) {
    console.error("Error reviewing report:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const Appointment = require("../model/appointments");
// Controller to give a diagnosis and create a new report
exports.giveDiagnosis = async (req, res) => {
  try {
    const { patientId, appointmentId, outcome } = req.body;
    const doctorId = req.user;

    // Find the appointment by ID
    const appointment = await Appointment.findOne({ _id: appointmentId });
    appointment.status = "completed";
    // If no appointment is found, return an error
    if (!appointment) {
      return res.status(404).json({
        message: "No Appointment Found",
      });
    }

    // Update the appointment outcome
    appointment.outcome = {
      diagnosis: outcome.diagnosis,
      prescription: outcome.prescription,
      notes: outcome.notes,
    };

    let newReport;

    // If there is a report request, create a new report
    if (outcome.reportRequest) {
      newReport = new Report({
        doctorId,
        patientId,
        appointmentId,
        reportType: outcome.reportRequest || "General", // Using the reportRequest from outcome if provided
        review: "", // You may need to add a review later
        status: "Pending", // Mark the status as pending if the report is yet to be reviewed
      });

      // Save the new report to the database
      await newReport.save();

      // Add the new report to the appointment's reportRequest array
      appointment.outcome.reportRequest =
        appointment.outcome.reportRequest || [];
      appointment.outcome.reportRequest.push(newReport._id);
    }

    // Save the updated appointment to the database
    await appointment.save();

    // Find the patient by ID and add the report ID to the reports array
    const patient = await Patient.findById(patientId);
    const doctor = await Doctor.findById(doctorId);
    if (patient) {
      patient.reports.push(newReport._id);
      doctor.reports.push(newReport._id);
      await patient.save();
      await doctor.save();
    } else {
      return res.status(404).json({
        message: "No Patient Found",
      });
    }

    // Send success response
    return res.status(201).json({
      message: "Diagnosis and report saved successfully",
      report: newReport || null, // Only return the report if it was created
    });
  } catch (error) {
    console.error("Error giving diagnosis:", error);

    // Send error response
    return res.status(500).json({
      message: "An error occurred while saving the diagnosis",
      error: error.message,
    });
  }
};

const fs = require("fs");
const { google } = require("googleapis");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const apikeys = require("./token.json");
const SCOPE = ["https://www.googleapis.com/auth/drive"];

// A Function that can provide access to Google Drive API
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

// A Function to check if a folder exists for the doctor, and create it if it doesn't
async function getOrCreateFolder(authClient, doctorId) {
  const drive = google.drive({ version: "v3", auth: authClient });

  const folderList = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${doctorId}' and trashed=false`,
    fields: "files(id, name)",
  });

  if (folderList.data.files.length > 0) {
    return folderList.data.files[0].id;
  }

  const folderMetadata = {
    name: doctorId,
    mimeType: "application/vnd.google-apps.folder",
    parents: ["1wAobbjcMFobmXRpaInTc20o19NJZVJz1"],
  };

  const folder = await drive.files.create({
    resource: folderMetadata,
    fields: "id",
  });

  return folder.data.id;
}

// A Function to upload a file to Google Drive and return its ID
async function uploadFile(authClient, filePath, fileName, folderId) {
  return new Promise((resolve, reject) => {
    const drive = google.drive({ version: "v3", auth: authClient });

    const fileMetaData = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      body: fs.createReadStream(filePath),
      mimeType: "application/pdf",
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
        resolve(file.data.id);
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
          role: "reader",
          type: "anyone",
        },
      },
      function (error) {
        if (error) {
          return reject(error);
        }
        resolve(fileId);
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
        fields: "webViewLink",
      },
      function (error, file) {
        if (error) {
          return reject(error);
        }
        resolve(file.data.webViewLink);
      }
    );
  });
}

// Modified reportUpload function to handle multiple files
exports.certificateUpload = async (req, res) => {
  const { fileName, certificateId } = req.body;

  const userId = req.user;
  console.log(req.user);
  console.log(req.body);

  try {
    const doctor = await Doctor.findById(userId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const certificates = doctor.certificates;

    // Find the correct certificate by ID
    const certificate = certificates.find(
      (cert) => cert._id.toString() === certificateId
    );
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    if (!fileName) {
      return res.status(400).json({ message: "File name is required" });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const authClient = await authorize();
    const folderId = await getOrCreateFolder(authClient, userId);

    const fileLinks = [];

    for (const file of files) {
      const { originalname, path } = file;
      console.log(`File received: ${originalname}`);

      const fileId = await uploadFile(authClient, path, fileName, folderId);
      await setFilePublic(authClient, fileId);
      const shareableLink = await getShareableLink(authClient, fileId);

      fileLinks.push({ fileName: originalname, link: shareableLink });
    }

    // Add the links to the certificate's links array
    certificate.links.push(...fileLinks.map((file) => file.link));

    // Save the updated doctor document
    await doctor.save();

    res.status(200).json({
      message: "Files uploaded and certificate updated successfully",
      links: fileLinks,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ message: "Error uploading files", error });
  } finally {
    if (req.files) {
      req.files.forEach((file) => fs.unlinkSync(file.path));
    }
  }
};
exports.profileImageUpload = async (req, res) => {
  const { fileName } = req.body;
  const userId = req.user;

  console.log("User ID:", req.user);
  console.log("Request Body:", req.body);

  try {
    // Find doctor by ID
    const doctor = await Doctor.findById(userId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (!fileName) {
      return res.status(400).json({ message: "File name is required" });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const authClient = await authorize();
    const folderId = await getOrCreateFolder(authClient, userId);

    const { originalname, path } = files[0];
    console.log(`File received: ${originalname}`);

    // Upload file and get its ID and shareable link
    const fileId = await uploadFile(authClient, path, fileName, folderId);
    await setFilePublic(authClient, fileId);
    const profileImageLink = await getShareableLink(authClient, fileId);

    // Set the profile image link in the doctor document
    doctor.imageUrl = profileImageLink;

    // Save the updated doctor document
    await doctor.save();

    res.status(200).json({
      message: "Profile image uploaded successfully",
      link: profileImageLink,
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    res.status(500).json({ message: "Error uploading profile image", error });
  } finally {
    if (req.files) {
      req.files.forEach((file) => fs.unlinkSync(file.path));
    }
  }
};

// Middleware to handle multiple file uploads
exports.uploadMiddleware = upload.array("files", 10); // Adjust the maximum file count as needed
