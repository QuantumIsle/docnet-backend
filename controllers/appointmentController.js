const Appointment = require("../model/appointments");
const Doctor = require("../model/doctorModel");
const Patient = require("../model/patientModel");
const dayjs = require("dayjs");
const mongoose = require("mongoose");
const Report = require("../model/reportsModel");

// Add an upcoming appointment
exports.addUpcomingAppointment = async (req, res) => {
  const { docId, patientId, date, time, reason, notes } = req.body;

  try {
    // Check if all required fields are provided
    if (!docId || !patientId || !date || !time) {
      return res.status(400).json({
        message: "Doctor ID, Patient ID, Date, and Time are required.",
      });
    }

    // Find the doctor and patient by ID
    const doctor = await Doctor.findById(docId);
    const patient = await Patient.findById(patientId);

    if (!doctor || !patient) {
      return res.status(404).json({
        message: "Doctor or Patient not found.",
      });
    }

    // Get doctor's time zone and adjust the appointment time accordingly
    const appointmentDate = dayjs
      .tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", doctor.timeZone || "UTC")
      .toDate(); // Convert to Date object

    // Ensure appointment date is valid and not in the past
    if (!appointmentDate || appointmentDate < new Date()) {
      return res
        .status(400)
        .json({ message: "Invalid or past appointment date and time." });
    }

    // Create a new upcoming appointment
    const appointment = new Appointment({
      docId: mongoose.Types.ObjectId(docId),
      patientId: mongoose.Types.ObjectId(patientId),
      date: appointmentDate,
      reason: reason || "",
      notes: notes || "",
    });

    // Save the appointment to the database
    const savedAppointment = await appointment.save();

    // Update the doctor and patient objects to include the new appointment
    doctor.appointments.push(savedAppointment._id);
    patient.appointments.push(savedAppointment._id);

    // Save the updated doctor and patient documents
    await doctor.save();
    await patient.save();

    res.status(201).json({
      message: "Upcoming appointment added successfully.",
      appointment: savedAppointment,
    });
  } catch (error) {
    console.error("Error adding upcoming appointment:", error);
    res
      .status(500)
      .json({ message: "Error occurred while adding appointment", error });
  }
};

exports.addCompletedAppointment = async (req, res) => {
  const { outcome, appointmentId } = req.body;
  let newReport ;
  try {
    // Find the appointment by ID
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    // Check if all required fields are provided
    if (!outcome || !outcome.diagnosis) {
      return res.status(400).json({
        message: "Doctor ID, Patient ID, and Outcome (Diagnosis) are required.",
      });
    }
    if (outcome.reportRequest) {
      const reportData = {
        doctorId: docId,
        patientId: patientId,
        appointmentId: newAppointment._id, // Reference to the newly created appointment
        reportType: outcome.reportRequest, // Assuming this is the type of report requested
        review: "", // This can be updated later, initially empty
        fileUrl: "", // File can be added later if needed
      };

      
      newReport = new Report(reportData);
      await newReport.save();
    }

    // Update the outcome and status of the appointment
    appointment.status = "completed";
    appointment.outcome = {
      diagnosis: outcome.diagnosis,
      prescription: outcome.prescription || [],
      reportRequest: newReport._id || [],
      notes: outcome.notes || "",
    };

    appointment.completedAt = new Date();

    // Save the completed appointment
    const savedCompletedAppointment = await appointment.save();

    // Return success response
    res.status(201).json({
      message: "Completed appointment added successfully.",
      appointment: savedCompletedAppointment,
    });
  } catch (error) {
    console.error("Error adding completed appointment:", error);
    res
      .status(500)
      .json({ message: "Error occurred while adding appointment", error });
  }
};
