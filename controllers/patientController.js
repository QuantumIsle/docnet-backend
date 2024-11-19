const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Patient = require("../model/patientModel");
// Registers a new patient
exports.register = async (req, res) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    email,
    password,
    phoneNumber,
    timeZone,
    country,
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
      contactNumber: phoneNumber,
      country,
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
      sameSite: "Strict",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    // Return the tokens and a success message
    res.status(200).json({
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      sameSite: "Strict",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(200).json({ message: "Logged in" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const id = req.user;

  try {
    // Find the patient by ID
    const patient = await Patient.findOne({ _id: id });

    // Check if patient exists
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Compare the old password with the hashed password in the database
    const isMatch = await bcrypt.compare(currentPassword, patient.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Update the patient's password
    patient.password = newPassword;
    await patient.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
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
exports.profileImageUpload = async (req, res) => {
  const { fileName } = req.body;
  const userId = req.user;

  console.log("User ID:", req.user);
  console.log("Request Body:", req.body);

  try {
    const patient = await Patient.findById(userId);
    if (!patient) {
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

    const fileId = await uploadFile(authClient, path, fileName, folderId);
    await setFilePublic(authClient, fileId);
    const profileImageLink = await getShareableLink(authClient, fileId);

    patient.imgUrl = profileImageLink;

    await patient.save();

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

// Middleware to handle file upload
exports.uploadMiddleware = upload.single("file"); // 'file' is the field name expected in the form data

const Review = require("../model/review");
const { json } = require("express");

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
