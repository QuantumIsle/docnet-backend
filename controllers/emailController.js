const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other email services like 'Outlook', 'Yahoo', etc.
  auth: {
    user: "mihanfernando23@gmail.com", // Replace with your email
    pass: "buyt jvvq vbdf baag", // Replace with your email password (or use App Passwords)
  },
});

/**
 * Send an email
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

module.exports = { sendEmail };
