// Define the schema for patient accounts
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const moment = require("moment-timezone");


const validTimeZones = moment.tz.names();

const PatientSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    imgUrl: {
      type: String,
      required: false,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    languagesSpoken: [
      {
        type: String,
        required: false,
      },
    ],
    email: {
      type: String,
      required: true,
      unique: true,
    },
    googleId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: false,
    },
    refreshToken: {
      type: String,
      required: false,
    },
    ethnicity: { type: String, required: false },

    existingConditions: {
      type: String,
      required: false,
    },
    weight: {
      type: Number,
      required: false,
    },
    height: {
      type: Number,
      required: false,
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: false,
    },
    timeZone: {
      type: String,
      required: true,
      enum: validTimeZones,
    },
    imgUrl: {
      type: String,
      required: false,
    },
    reports: [
      {
        type: Schema.Types.ObjectId,
        ref: "Report",
        unique: false,
      },
    ],
    appointments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Appointment",
        unique: false,
      },
    ],
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
        unique: false,
      },
    ],
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

// Password hashing before save
PatientSchema.pre("save", async function (next) {
  if (this.password) {
    try {
      if (this.isModified("password") || this.isNew) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

PatientSchema.statics.addPatient = async function (patientData) {
  try {
    // Check if a patient already exists with the same email or Google ID
    const existingPatient = await this.findOne({ email: patientData.email });

    if (existingPatient) {
      throw new Error("Patient with this email already exists.");
    }

    // Create and save the new patient
    const newPatient = new this(patientData);
    await newPatient.save();

    return newPatient;
  } catch (error) {
    throw new Error(error.message);
  }
};


const Patient = mongoose.model("Patient", PatientSchema);

module.exports = Patient;
