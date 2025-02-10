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
      ref: "Appointment", // Reference to the completed appointment
      required: false,
    },
    reportType: {
      type: String,
      required: false,
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
      required: false,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

// Static method to get reports by doctorId and populate the patientId
ReportSchema.statics.getReportsByDoctorId = async function (doctorId) {
  return this.find({ doctorId })
    .populate("patientId") // Populate the patient details
    .exec();
};

// Static method to get reports by patientId and populate the doctorId
ReportSchema.statics.getReportsByPatientId = async function (patientId) {
  const data = this.find({ patientId })
    .populate("doctorId") // Populate the doctor details
    .exec();
  return data;
};

// Static method to get a report by its id
ReportSchema.statics.getReportById = async function (reportId) {
  return this.findById(reportId)
    .populate("doctorId") // Populate the doctor details
    .populate("patientId") // Populate the patient details
    .exec();
};

const Report = mongoose.model("Report", ReportSchema);

// Export the Report model
module.exports = Report;
