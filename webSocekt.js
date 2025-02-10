const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const url = require("url");
const jwt = require("jsonwebtoken");
const Doctor = require("./model/doctorModel");
const Patient = require("./model/patientModel");
const cors = require("cors");
const Appointment = require("./model/appointments");

require("dotenv").config();

const corsOptions = {
  origin: process.env.FRONTEND_URL, // React frontend's URL
  credentials: true, // Allow cookies (credentials) to be sent and received
};

// Use CORS to allow cross-origin requests

const app = express();
const server = http.createServer(app);
const ws = new WebSocket.Server({ server });

const mongoose = require("mongoose");

// Connect to MongoDB
const dbURI = process.env.MONGO_URI;
mongoose
  .connect(dbURI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Array to store connected users
let connectedDoctors = [];
let connectedPatients = [];
app.use(cors(corsOptions));
// Serve static files (React frontend) from the 'build' folder
app.use(express.static("build"));

// When a message is received
// WebSocket connection handler
ws.on("connection", (ws, req) => {
  // Parse query parameters (e.g., username) from the WebSocket URL
  const params = url.parse(req.url, true).query;
  const role = params.role;
  const userId = params.id; // User ID (doctor or patient) passed as a parameter

  if (role === "doctor" && userId) {
    connectedDoctors.push({ id: userId, ws });
    console.log("Doctor connected:", userId);
  } else if (role === "patient" && userId) {
    connectedPatients.push({ id: userId, ws });
    console.log("Patient connected:", userId);
  }

  // When a message is received
  ws.on("message", async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log(parsedMessage);

      if (parsedMessage.type === "appointment") {
        const { doctorId, patientId, appointmentDetails } = parsedMessage;

        // Create a new appointment
        const appointment = new Appointment({
          doctorId: new mongoose.Types.ObjectId(doctorId),
          patientId: new mongoose.Types.ObjectId(patientId),
          appointmentDate: new Date(),
          appointmentType: "quick",
          reason: "",
          notes: "",
        });

        // Save the appointment in the database
        const savedAppointment = await appointment.save();
        console.log("Appointment created with ID:", savedAppointment._id);

        // Find the doctor in the connectedDoctors array
        const targetDoctor = connectedDoctors.find(
          (doctor) => doctor.id === doctorId
        );

        if (targetDoctor && targetDoctor.ws) {
          // Send the appointment message to the specific doctor with appointment ID
          targetDoctor.ws.send(
            JSON.stringify({
              type: "appointment",
              from: patientId,
              appointmentId: savedAppointment._id,
              details: appointmentDetails,
            })
          );
          console.log(`Appointment message sent to doctor ${doctorId}`);
        } else {
          console.log(`Doctor with ID ${doctorId} is not currently connected.`);
        }
      }

      // Check if the message type is "appointmentAccept"
      if (parsedMessage.type === "appointmentAccept") {
        const { appointmentId } = parsedMessage;
        const appointment = await Appointment.findOne({ _id: appointmentId });

        if (!appointment) {
          console.log(`Appointment with ID ${appointmentId} not found.`);
          return;
        }

        const patientId = appointment.patientId.toString();
        const doctorId = appointment.doctorId.toString();

        // Find the doctor and patient in the connected users
        const targetDoctor = connectedDoctors.find(
          (doctor) => doctor.id === doctorId
        );
        const targetPatient = connectedPatients.find(
          (patient) => patient.id === patientId
        );

        // Update the doctor's record with the appointment ID
        await Doctor.updateOne(
          { _id: doctorId },
          { $addToSet: { appointments: appointmentId } } // Add the appointment ID to the appointments array (avoids duplicates)
        );

        // Update the patient's record with the appointment ID
        await Patient.updateOne(
          { _id: patientId },
          { $addToSet: { appointments: appointmentId } } // Add the appointment ID to the appointments array (avoids duplicates)
        );

        // Send appointment ID to the doctor
        if (targetDoctor && targetDoctor.ws) {
          targetDoctor.ws.send(
            JSON.stringify({
              type: "appointmentConfirmed",
              appointmentId: appointmentId,
            })
          );
          console.log(`Appointment ID sent to doctor ${doctorId}`);
        } else {
          console.log(`Doctor with ID ${doctorId} is not currently connected.`);
        }

        // Send appointment ID to the patient
        if (targetPatient && targetPatient.ws) {
          targetPatient.ws.send(
            JSON.stringify({
              type: "appointmentConfirmed",
              appointmentId: appointmentId,
            })
          );
          console.log(`Appointment ID sent to patient ${patientId}`);
        } else {
          console.log(
            `Patient with ID ${patientId} is not currently connected.`
          );
        }
      }

      if (parsedMessage.type === "appointmentDecline") {
        const { appointmentId } = parsedMessage;
        const appointment = await Appointment.findOne({ _id: appointmentId });

        if (!appointment) {
          console.log(`Appointment with ID ${appointmentId} not found.`);
          return;
        }

        const patientId = appointment.patientId.toString();

        const targetPatient = connectedPatients.find(
          (patient) => patient.id === patientId
        );

        // Send appointment ID to the patient
        if (targetPatient && targetPatient.ws) {
          targetPatient.ws.send(
            JSON.stringify({
              type: "appointmentDecline",
              appointmentId: appointmentId,
            })
          );
          console.log(`Appointment ID sent to patient ${patientId}`);
        } else {
          console.log(
            `Patient with ID ${patientId} is not currently connected.`
          );
        }

        // Optionally, you can delete the appointment document from the database if needed
        await Appointment.deleteOne({ _id: appointmentId });
        console.log(`Appointment with ID ${appointmentId} has been removed.`);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  // When the WebSocket connection is closed
  ws.on("close", () => {
    console.log(`${userId} disconnected`);

    // Remove the user from the connected users array
    if (role === "doctor") {
      connectedDoctors = connectedDoctors.filter((user) => user.id !== userId);
    } else if (role === "patient") {
      connectedPatients = connectedPatients.filter(
        (user) => user.id !== userId
      );
    }
  });
});

// When the WebSocket connection is closed
ws.on("close", () => {
  console.log(`${userId} disconnected`);

  // Remove the doctor from the list of connected doctors if it's a doctor
  if (role === "doctor") {
    connectedDoctors = connectedDoctors.filter((user) => user.id !== userId);
  }
});

app.get("/signature", async (req, res) => {
  const { id } = req.query; // Get the appointmentId from query parameters
  console.log(id);

  try {
    // Get the user ID from req.user (populated by your auth middleware)
    const userId = req.user;

    // Check if the user is a doctor or patient
    let isDoctor = false;
    let isPatient = false;
    let role_type = 1; // Default role type

    // First, check if the user is a doctor
    const doctor = await Doctor.findById(userId);
    if (doctor) {
      isDoctor = true;
      role_type = 0; // Role type for host (doctor)
    }

    // If not a doctor, check if the user is a patient
    if (!isDoctor) {
      const patient = await Patient.findById(userId);
      if (patient) {
        isPatient = true;
        role_type = 1; // Role type for participant (patient)
      }
    }

    // If the user is neither a doctor nor a patient, handle it appropriately
    if (!isDoctor && !isPatient) {
      return res.status(400).send("User not found in the system.");
    }

    // Prepare JWT payload
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2-hour expiry
    const oHeader = { alg: "HS256", typ: "JWT" };
    const oPayload = {
      app_key: process.env.SDK_KEY,
      tpc: id, // Use the appointmentId as the unique meeting identifier
      role_type: role_type, // Host (doctor) or participant (patient)
      version: 1,
      iat: iat,
      exp: exp,
    };

    // Sign the JWT
    const sdkJWT = jwt.sign(oPayload, process.env.SDK_SECRET, {
      algorithm: "HS256",
      header: oHeader,
    });

    res.send(sdkJWT);
  } catch (error) {
    console.log("Error in /signature route:", error);
    res.status(500).send("Internal server error");
  }
});

// API to get the list of online doctors
app.get("/connected-doctors", async (req, res) => {
  try {
    const doctorIds = connectedDoctors.map((doctor) => doctor.id);

    // Fetch all doctor details from the database using the IDs
    const doctors = await Doctor.find({ _id: { $in: doctorIds } });

    // Map and structure the response with relevant doctor details
    const onlineDoctors = doctors.map((doctor) => ({
      id: doctor._id,
      name: `${doctor.firstName} ${doctor.lastName}`,
      specialization: doctor.specialization,
      rating: doctor.rating,
      reviews: doctor.reviews,
      imageUrl: doctor.imageUrl,
    }));

    res.json({ onlineDoctors });
  } catch (error) {
    console.log("Error fetching online doctors:", error);
    res.status(500).send("Internal server error");
  }
});
app.get("/connected-patients", async (req, res) => {
  try {
    const patientIds = connectedPatients.map((patient) => patient.id);

    // Fetch all doctor details from the database using the IDs
    const patients = await Patient.find({ _id: { $in: patientIds } });

    // Map and structure the response with relevant doctor details
    const onlinePatients = patients.map((patient) => ({
      id: patient._id,
      name: `${patient.firstName} ${patient.lastName}`,
    }));

    res.json({ onlinePatients });
  } catch (error) {
    console.log("Error fetching online Patients:", error);
    res.status(500).send("Internal server error");
  }
});

// Start the server
server.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
