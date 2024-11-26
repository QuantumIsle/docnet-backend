const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other email services like 'Outlook', 'Yahoo', etc.
  auth: {
    user: "mihanfernando23@gmail.com", // Replace with your email
    pass: "buyt jvvq vbdf baag", // Replace with your email password (or use App Passwords)
  },
});


const sendPatientUpcomingAppointmentEmail = async (to, doctorName, appointmentDate, reason) => {
  const subject = "Confirmation of Your Upcoming Appointment with Dr. " + doctorName;
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

const sendDoctorUpcomingAppointmentEmail = async (to, patientName, appointmentDate, reason) => {
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


const sendPatientCompletedAppointmentEmail = async (to, doctorName, appointmentDate, diagnosis, prescriptions, reportRequest) => {
  const subject = "Summary of Your Completed Appointment with Dr. " + doctorName;
  const text = `Dear Patient,

Below is the summary of your recent appointment with Dr. ${doctorName}:

Appointment Summary:
- Doctor: Dr. ${doctorName}
- Date: ${appointmentDate}
- Diagnosis: ${diagnosis}
- Prescriptions: ${prescriptions ? prescriptions : 'No prescriptions provided'}

${reportRequest ? `A report has been requested: ${reportRequest}. You will be notified once it is ready.` : ''}

Thank you for choosing DocnetAI for your healthcare needs.

Best regards,
DocnetAI Support`;

  return sendEmail(to, subject, text);
};


const sendDoctorCompletedAppointmentEmail = async (to, patientName, appointmentDate, diagnosis, prescriptions, reportRequest) => {
  const subject = "Appointment with Patient " + patientName + " Completed";
  const text = `Dear Dr.,

The appointment with patient ${patientName} on ${appointmentDate} has been marked as completed. Below is the summary:

Appointment Summary:
- Patient: ${patientName}
- Diagnosis: ${diagnosis}
- Prescriptions: ${prescriptions ? prescriptions : 'No prescriptions provided'}
${reportRequest ? `Report Requested: ${reportRequest}` : ''}

Thank you for your ongoing service with DocnetAI.

Best regards,
DocnetAI Support`;

  return sendEmail(to, subject, text);
};


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
