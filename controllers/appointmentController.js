const UpcomingAppointment = require("../model/appointments/UpcomingAppointmentModel");
const Doctor = require("../model/doctorModel");
const Patient = require("../model/patientModel");
const dayjs = require("dayjs");
const mongoose = require("mongoose");

// Add an upcoming appointment
exports.addUpcomingAppointment = async (req, res) => {
  const { docId, patientId, date, time } = req.body;

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
    const newAppointment = new UpcomingAppointment({
      docId: mongoose.Types.ObjectId(docId),
      patientId: mongoose.Types.ObjectId(patientId),
      date: appointmentDate,
      reason: reason || "",
      notes: notes || "",
    });

    // Save the appointment to the database
    const savedAppointment = await newAppointment.save();

    // Add appointment references to doctor and patient
    await Doctor.findByIdAndUpdate(docId, {
      $push: { upcomingAppointments: savedAppointment._id },
    });
    await Patient.findByIdAndUpdate(patientId, {
      $push: { upcomingAppointments: savedAppointment._id },
    });

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
  const { outcome, upcomingAppointmentId } = req.body;

  try {
    const upcomingAppointment = await UpcomingAppointment.findById({
      _id: upcomingAppointmentId,
    });
    const docId = upcomingAppointment.docId;
    const patientId = upcomingAppointment.patientId;
    // Validate necessary fields
    if (!docId || !patientId || !outcome || !outcome.diagnosis) {
      return res.status(400).json({
        message: "Doctor ID, Patient ID, and Outcome (Diagnosis) are required.",
      });
    }

    // Create a new completed appointment
    const newCompletedAppointment = new CompletedAppointment({
      docId: mongoose.Types.ObjectId(docId),
      patientId: mongoose.Types.ObjectId(patientId),
      outcome: {
        diagnosis: outcome.diagnosis,
        prescription: outcome.prescription || [],
        reportRequest: outcome.reportRequest || [],
        notes: outcome.notes || "",
      },
    });

    // Save the completed appointment to the database
    const savedCompletedAppointment = await newCompletedAppointment.save();

    // Remove the upcoming appointment (if provided) and move to completed appointments
    if (upcomingAppointmentId) {
      await UpcomingAppointment.findByIdAndDelete(upcomingAppointmentId);
    }

    // Add the completed appointment to both doctor and patient records
    await Doctor.addCompletedAppointment(
      docId,
      upcomingAppointmentId,
      savedCompletedAppointment._id
    );
    await Patient.addCompletedAppointment(
      patientId,
      upcomingAppointmentId,
      savedCompletedAppointment._id
    );

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

// Cancel an upcoming appointment
exports.cancelUpcomingAppointment = async (req, res) => {
  const { appointmentId } = req.body;

  try {
    // Check if appointmentId is provided
    if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res
        .status(400)
        .json({ message: "Valid Appointment ID is required." });
    }

    // Find the upcoming appointment by ID
    const appointment = await UpcomingAppointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    const { docId, patientId } = appointment;

    // Remove the upcoming appointment reference from the doctor's record
    await Doctor.findByIdAndUpdate(
      docId,
      { $pull: { upcomingAppointments: appointmentId } },
      { new: true } // Return the updated doctor document
    );

    // Remove the upcoming appointment reference from the patient's record
    await Patient.findByIdAndUpdate(
      patientId,
      { $pull: { upcomingAppointments: appointmentId } },
      { new: true } // Return the updated patient document
    );

    // Remove the actual appointment from the database
    await appointment.remove();

    // Respond with success
    res.status(200).json({ message: "Appointment cancelled successfully." });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res
      .status(500)
      .json({ message: "Error occurred while cancelling appointment", error });
  }
};
