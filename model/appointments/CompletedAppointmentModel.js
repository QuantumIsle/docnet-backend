const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
    outcome: {
      diagnosis: {
        type: String,
        required: true, 
      },
      prescription: [
        {
          medicine: { type: String, required: true },
          howToUse: { type: String, required: true },
        },
      ],
      reportRequest: [{
        type: String, 
        required: false,
      }],
      notes: {
        type: String,
        required: false, 
      },
    },
  },
  {
    timestamps: true, 
  }
);

const CompletedAppointment = mongoose.model(
  "CompletedAppointment",
  CompletedAppointmentSchema
);

// Export the CompletedAppointment model
module.exports = CompletedAppointment;
