const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for appointments
const AppointmentSchema = new Schema(
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
    appointmentNumber: {
      type: String,
      unique: true, 
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
      required: true,
    },
    outcome: {
      diagnosis: {
        type: String,
      },
      prescription: [
        {
          medicine: { type: String },
          howToUse: { type: String },
        },
      ],
      reportRequest: [
        {
          type: Schema.Types.ObjectId,
          ref: "Report",
        },
      ],
      notes: {
        type: String,
      },
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Function to generate a random alphanumeric 5-character string
AppointmentSchema.statics.generateUniqueAppointmentNumber = async function () {
  const characters = "0123456789abcdefghijklmnopqrstuvwxyz";
  let appointmentNumber;
  let isUnique = false;

  while (!isUnique) {
    // Generate a random 5-character string
    appointmentNumber = Array.from(
      { length: 5 },
      () => characters[Math.floor(Math.random() * characters.length)]
    ).join("");

    // Check if the generated number is unique
    const existingAppointment = await this.findOne({ appointmentNumber });
    if (!existingAppointment) {
      isUnique = true; // If no appointment with this number exists, it's unique
    }
  }

  return appointmentNumber;
};

// Pre-save middleware to generate a unique appointment number before saving
AppointmentSchema.pre("save", async function (next) {
  if (!this.appointmentNumber) {
    this.appointmentNumber =
      await this.constructor.generateUniqueAppointmentNumber();
  }
  next();
});

const Appointment = mongoose.model("Appointment", AppointmentSchema);

// Export the Appointment model
module.exports = Appointment;
