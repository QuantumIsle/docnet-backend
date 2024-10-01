const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for reports
const ReportSchema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "CompletedAppointment", // Reference to the completed appointment
      required: true,
    },
    reportType: {
      type: String, 
      required: true,
    },
    review: {
      type: String,
      required: false, 
    },
    fileUrl: {
      type: String, 
      required: false,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Reviewed"],
      default: "Pending",
      required: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

const Report = mongoose.model("Report", ReportSchema);

// Export the Report model
module.exports = Report;
