const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const db = mongoose.connection.useDb("mydatabase");

// Define the schema for completed appointments
const CompletedAppointmentSchema = new Schema(
  {
    docId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    outcome: {
      type: String,
      required: false,
    },
    followUpDate: {
      type: Date,
      required: false,
    },
    reason: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    prescription: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

const CompletedAppointment = mongoose.model(
  "CompletedAppointment",
  CompletedAppointmentSchema
);

// Export the CompletedAppointment model
module.exports = CompletedAppointment;
