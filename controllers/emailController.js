const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other email services like 'Outlook', 'Yahoo', etc.
  auth: {
    user: "mihanfernando23@gmail.com", // Replace with your email
    pass: "buyt jvvq vbdf baag", // Replace with your email password (or use App Passwords)
  },
});

/**
 * Send Upcoming Appointment Email to Patient
 * @param {string} to - The patient's email address
 * @param {string} doctorName - The doctor's name
 * @param {string} appointmentDate - The appointment date and time
 * @param {string} reason - The reason for the appointment
 * @returns {Promise}
 */
const sendPatientUpcomingAppointmentEmail = async (
  to,
  doctorName,
  appointmentDate,
  reason
) => {
  const subject =
    "Confirmation of Your Upcoming Appointment with Dr. " + doctorName;
  const text = `Dear Patient,

We are pleased to confirm your upcoming appointment with Dr. ${doctorName}. Below are the appointment details:

Appointment Details:
- Doctor: Dr. ${doctorName}
- Date & Time: ${appointmentDate}
- Reason for Visit: ${reason}

Please arrive at least 10 minutes before your scheduled time. If you need to reschedule, contact us at your earliest convenience.

Best regards,
DocnetAI Support`;

  return sendEmail(to, subject, text);
};

/**
 * Send Upcoming Appointment Email to Doctor
 * @param {string} to - The doctor's email address
 * @param {string} patientName - The patient's name
 * @param {string} appointmentDate - The appointment date and time
 * @param {string} reason - The reason for the appointment
 * @returns {Promise}
 */
const sendDoctorUpcomingAppointmentEmail = async (
  to,
  patientName,
  appointmentDate,
  reason
) => {
  const subject = "New Appointment Confirmed with Patient " + patientName;
  const text = `Dear Dr.,

You have a confirmed appointment with patient ${patientName}. Below are the details:

Appointment Details:
- Patient: ${patientName}
- Date & Time: ${appointmentDate}
- Reason for Visit: ${reason}

Please ensure to review the patient's records before the appointment.

Best regards,
DocnetAI Support`;

  return sendEmail(to, subject, text);
};

/**
 * Send Completed Appointment Email to Patient
 * @param {string} to - The patient's email address
 * @param {string} doctorName - The doctor's name
 * @param {string} appointmentDate - The appointment date
 * @param {string} diagnosis - The diagnosis details
 * @param {string} prescriptions - Prescription details (if applicable)
 * @param {string} reportRequest - Report type requested (if applicable)
 * @returns {Promise}
 */
const sendPatientCompletedAppointmentEmail = async (
  to,
  doctorName,
  appointmentDate,
  diagnosis,
  prescriptions,
  reportRequest
) => {
  const subject =
    "Summary of Your Completed Appointment with Dr. " + doctorName;
  const text = `Dear Patient,

Below is the summary of your recent appointment with Dr. ${doctorName}:

Appointment Summary:
- Doctor: Dr. ${doctorName}
- Date: ${appointmentDate}
- Diagnosis: ${diagnosis}
- Prescriptions: ${prescriptions ? prescriptions : "No prescriptions provided"}

${
  reportRequest
    ? `A report has been requested: ${reportRequest}. You will be notified once it is ready.`
    : ""
}

Thank you for choosing DocnetAI for your healthcare needs.

Best regards,
DocnetAI Support`;

  return sendEmail(to, subject, text);
};

/**
 * Send Completed Appointment Email to Doctor
 * @param {string} to - The doctor's email address
 * @param {string} patientName - The patient's name
 * @param {string} appointmentDate - The appointment date
 * @param {string} diagnosis - The diagnosis details
 * @param {string} prescriptions - Prescription details (if applicable)
 * @param {string} reportRequest - Report type requested (if applicable)
 * @returns {Promise}
 */
const sendDoctorCompletedAppointmentEmail = async (
  to,
  patientName,
  appointmentDate,
  diagnosis,
  prescriptions,
  reportRequest
) => {
  const subject = "Appointment with Patient " + patientName + " Completed";
  const text = `Dear Dr.,

The appointment with patient ${patientName} on ${appointmentDate} has been marked as completed. Below is the summary:

Appointment Summary:
- Patient: ${patientName}
- Diagnosis: ${diagnosis}
- Prescriptions: ${prescriptions ? prescriptions : "No prescriptions provided"}
${reportRequest ? `Report Requested: ${reportRequest}` : ""}

Thank you for your ongoing service with DocnetAI.

Best regards,
DocnetAI Support`;

  return sendEmail(to, subject, text);
};

/**
 * Helper function to send emails using Nodemailer
 * @param {string} to - The recipient's email address
 * @param {string} subject - The subject of the email
 * @param {string} text - The content of the email
 * @returns {Promise} - A promise indicating the success/failure of the email sending operation
 */
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: '"DocnetAI Support" <support@docnetai.com>',
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = {
  sendPatientUpcomingAppointmentEmail,
  sendDoctorUpcomingAppointmentEmail,
  sendPatientCompletedAppointmentEmail,
  sendDoctorCompletedAppointmentEmail,
};
