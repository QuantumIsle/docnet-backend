const Appointment = require("../model/appointments");
const Doctor = require("../model/doctorModel");
const Patient = require("../model/patientModel");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const mongoose = require("mongoose");
const Report = require("../model/reportsModel");
const {
    sendPatientUpcomingAppointmentEmail,
    sendDoctorUpcomingAppointmentEmail,
    sendPatientCompletedAppointmentEmail,
    sendDoctorCompletedAppointmentEmail,
} = require("./emailController");
// const { refundPayment } = require("./paymentController");
// const { refundPayment } = require("./paymentController");
// const paymentController = require("./paymentController.js");
// const { refundPayment } = paymentController;
// const refundPayment = paymentController.refundPayment;
dayjs.extend(utc);
dayjs.extend(timezone);

exports.addUpcomingAppointment = async (
    paymentIntentId, // Use them if needed
    status,
    appointmentDetails
) => {
    const { docId, date, patientId } = JSON.parse(appointmentDetails);

    console.log("Doc ID: ", docId);
    console.log("Date: ", date);
    console.log("Patient ID: ", patientId);

    try {
        // Check if all required fields are provided
        if (!docId || !patientId || !date) {
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

        // Ensure appointment date is valid and not in the past
        if (!date || date < new Date()) {
            return res.status(400).json({
                message: "Invalid or past appointment date and time.",
            });
        }

        // Create a new upcoming appointment
        const appointment = new Appointment({
            doctorId: new mongoose.Types.ObjectId(docId), // Use new keyword here
            patientId: new mongoose.Types.ObjectId(patientId), // Use new keyword here
            appointmentDate: date,
            paymentDetails: {
                paymentId: paymentIntentId,
            },
            // reason: req.body.reason || "",
            // notes: req.body.notes || "",
            reason: appointmentDetails.reason || "",
            notes: appointmentDetails.notes || "",
        });

        // Save the appointment to the database
        const savedAppointment = await appointment.save();

        // Update the doctor and patient objects to include the new appointment
        doctor.appointments.push(savedAppointment._id);
        patient.appointments.push(savedAppointment._id);
        await sendPatientUpcomingAppointmentEmail(
            patient.email,
            doctor.firstName,
            date,
            // req.body.reason || ""
            appointmentDetails.reason || ""
        );
        await sendDoctorUpcomingAppointmentEmail(
            doctor.email,
            patient.firstName,
            date,
            // req.body.reason || ""
            appointmentDetails.reason || ""
        );

        // Save the updated doctor and patient documents
        await doctor.save();
        await patient.save();

        // Response commented out because this is not called as an API endpoint anymore

        // res.status(201).json({
        //   message: "Upcoming appointment added successfully.",
        //   appointment: savedAppointment,
        // });

        console.log("Upcoming appointment added successfully.");
    } catch (error) {
        console.error("Error adding upcoming appointment:", error);
        res.status(500).json({
            message: "Error occurred while adding appointment",
            error,
        });
    }
};

// Add an upcoming appointment
// exports.addUpcomingAppointment = async (req, res) => {
//   const { docId, date } = req.body;
//   console.log(date);

//   const patientId = req.user;
//   try {
//     // Check if all required fields are provided
//     if (!docId || !patientId || !date) {
//       return res.status(400).json({
//         message: "Doctor ID, Patient ID, Date, and Time are required.",
//       });
//     }

//     // Find the doctor and patient by ID
//     const doctor = await Doctor.findById(docId);
//     const patient = await Patient.findById(patientId);

//     if (!doctor || !patient) {
//       return res.status(404).json({
//         message: "Doctor or Patient not found.",
//       });
//     }

//     // Ensure appointment date is valid and not in the past
//     if (!date || date < new Date()) {
//       return res
//         .status(400)
//         .json({ message: "Invalid or past appointment date and time." });
//     }

//     // Create a new upcoming appointment
//     const appointment = new Appointment({
//       doctorId: new mongoose.Types.ObjectId(docId), // Use new keyword here
//       patientId: new mongoose.Types.ObjectId(patientId), // Use new keyword here
//       appointmentDate: date,
//       reason: req.body.reason || "",
//       notes: req.body.notes || "",
//     });

//     // Save the appointment to the database
//     const savedAppointment = await appointment.save();

//     // Update the doctor and patient objects to include the new appointment
//     doctor.appointments.push(savedAppointment._id);
//     patient.appointments.push(savedAppointment._id);
//     await sendPatientUpcomingAppointmentEmail(
//       patient.email,
//       doctor.firstName,
//       date,
//       req.body.reason || ""
//     );
//     await sendDoctorUpcomingAppointmentEmail(
//       doctor.email,
//       patient.firstName,
//       date,
//       req.body.reason || ""
//     );

//     // Save the updated doctor and patient documents
//     await doctor.save();
//     await patient.save();

//     res.status(201).json({
//       message: "Upcoming appointment added successfully.",
//       appointment: savedAppointment,
//     });
//   } catch (error) {
//     console.error("Error adding upcoming appointment:", error);
//     res
//       .status(500)
//       .json({ message: "Error occurred while adding appointment", error });
//   }
// };

exports.addCompletedAppointment = async (req, res) => {
    const { outcome, appointmentId } = req.body;
    let newReport;
    try {
        // Find the appointment by ID
        const appointment = await Appointment.findById(appointmentId)
            .populate("doctorId")
            .populate("patientId");
        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found.",
            });
        }

        const doctor = appointment.doctorId;
        const patient = appointment.patientId;

        // Check if all required fields are provided
        if (!outcome || !outcome.diagnosis) {
            return res.status(400).json({
                message: "Diagnosis and outcome are required.",
            });
        }

        // Create a report if requested
        if (outcome.reportRequest) {
            const reportData = {
                doctorId: doctor._id,
                patientId: patient._id,
                appointmentId: appointment._id, // Reference to the existing appointment
                reportType: outcome.reportRequest, // Type of report requested
                review: "", // Initially empty, can be updated later
                fileUrl: "", // File can be added later
            };

            newReport = new Report(reportData);
            await newReport.save();
        }

        // Update the outcome and status of the appointment
        appointment.status = "completed";
        appointment.outcome = {
            diagnosis: outcome.diagnosis,
            prescription: outcome.prescription || [],
            reportRequest: newReport ? newReport._id : null,
            notes: outcome.notes || "",
        };

        appointment.completedAt = new Date();

        // Save the completed appointment
        const savedCompletedAppointment = await appointment.save();

        // Send emails to doctor and patient
        await sendDoctorCompletedAppointmentEmail(
            doctor.email,
            patient.name,
            appointment.completedAt,
            outcome.diagnosis,
            outcome.prescription || [],
            newReport ? outcome.reportRequest : null
        );

        await sendPatientCompletedAppointmentEmail(
            patient.email,
            doctor.name,
            appointment.completedAt,
            outcome.diagnosis,
            outcome.prescription || [],
            newReport ? outcome.reportRequest : null
        );

        // Return success response
        res.status(201).json({
            message: "Completed appointment added successfully.",
            appointment: savedCompletedAppointment,
        });
    } catch (error) {
        console.error("Error adding completed appointment:", error);
        res.status(500).json({
            message: "Error occurred while adding appointment",
            error,
        });
    }
};

exports.cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        console.log("🚀 ~ appointmentId:", appointmentId);

        // Fetch appointment details from the database
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        const doctor = await Doctor.findById(appointment.doctorId);
        const patient = await Patient.findById(appointment.patientId);

        // Check if the cancellation is within the allowed time frame
        const appointmentDate = new Date(appointment.appointmentDate);
        const currentDate = new Date();
        const diffInDays =
            (appointmentDate - currentDate) / (1000 * 60 * 60 * 24);
        console.log("diffInDays", diffInDays);
        if (diffInDays < 2) {
            return res
                .status(400)
                .json({
                    message:
                        "Cancellations are only allowed 2 or more days before the appointment date.",
                });
        }

        // Process refund
        // const refund = await stripe.refunds.create({
        //     payment_intent: appointment.paymentIntentId, // Stored during appointment creation
        // });

        // const paymentRefundResponse = await refundPayment(appointment.paymentIntentId);
        // const refund = paymentRefundResponse.data;

        // Step 2: Call the refundPayment function in PaymentController

        const { refundPayment } = require("./paymentController");
        // console.log(refundPayment);
        const paymentId = appointment.paymentDetails.paymentId; // Assuming appointment has a reference to payment ID
        const refundResponse = await refundPayment(
            paymentId
        );

        if (!refundResponse.success) {
            return res
                .status(400)
                .json({
                    message: "Refund failed.",
                    error: refundResponse.error,
                });
        }

        // Update appointment status in the database
        appointment.status = "cancelled";
        appointment.paymentDetails.refundId = refundResponse.data.id; // Optional: Store refund details
        await appointment.save();

        // Update the doctor and patient objects to include the new appointment
        doctor.appointments = doctor.appointments.filter(
            (id) => id.toString() !== appointmentId
        );
        patient.appointments = patient.appointments.filter(
            (id) => id.toString() !== appointmentId
        );

        doctor.save();
        patient.save();

        res.status(200).json({
            message: "Appointment cancelled and refund processed.",
            // refundResponse,
        });
    } catch (error) {
        console.error("Error cancelling appointment:", error);
        res.status(500).json({
            message: "Internal server error from canceling appointment",
        });
    }
};

// module.exports = { cancelAppointment };
