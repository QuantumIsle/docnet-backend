const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const moment = require("moment-timezone");

const Review = require("./review/review"); // Import the Review model

const validTimeZones = moment.tz.names();
// Define the schema for doctor accounts
const DoctorSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: false,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    videoVisitHours: { type: Number, required: false, default: 0 },

    // New fields added here
    about: {
      type: String,
      required: false,
    },
    qualifications: [
      {
        type: String,
        required: false,
      },
    ],
    professionalBackground: {
      type: String,
      required: false,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0, // Aggregate rating based on reviews
    },
    timeZone: {
      type: String,
      required: false,
      enum: validTimeZones, // Automatically populate time zones using moment-timezone
    },
    professionStartedYear: {
      type: Number,
      required: false,
      default: 0,
    },
    languagesSpoken: {
      type: String,
    },
    completedAppointments: [
      {
        type: Schema.Types.ObjectId,
        ref: "CompletedAppointment",
        unique: false,
      },
    ],
    upcomingAppointments: [
      {
        type: Schema.Types.ObjectId,
        ref: "UpcomingAppointment",
        unique: false,
      },
    ],
    workingHours: {
      startTime: {
        type: String, // Use String to allow flexible time format (e.g., "09:00 AM")
        required: false,
      },
      endTime: {
        type: String, // Use String to allow flexible time format (e.g., "05:00 PM")
        required: false,
      },
    },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }], // Reference to Review model
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

// Password hashing middleware
DoctorSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password") || this.isNew) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Add a new doctor
DoctorSchema.statics.addDoctor = async function (doctorData) {
  try {
    const existingDoctor = await this.findOne({
      email: doctorData.email,
    });
    if (existingDoctor) {
      throw new Error("Doctor with this email already exists.");
    }

    // Create a new doctor
    const newDoctor = new this(doctorData);
    await newDoctor.save();
    return newDoctor;
  } catch (error) {
    throw error;
  }
};

// Get all doctors
DoctorSchema.statics.getAllDoctors = async function () {
  try {
    const doctors = await this.find().populate("reviews"); // Populate reviews when fetching all doctors
    return doctors;
  } catch (error) {
    console.log(error);

    throw error;
  }
};

// Get a specific doctor by email and populate reviews
DoctorSchema.statics.getDoctorByID = async function (id) {
  try {
    const doctor = await this.findOne({ _id: id })
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          select: "firstName lastName imgUrl", // Populate user details in reviews
        },
      })
      .populate({
        path: "completedAppointments",
        populate: {
          path: "patientId",
          select: "firstName lastName", // Populate user details in reviews
        },
      })
      .populate({
        path: "upcomingAppointments",
        populate: {
          path: "patientId",
          select: "firstName lastName", // Populate user details in reviews
        },
      });
    if (!doctor) {
      throw new Error("Doctor not found.");
    }
    

    return doctor;
  } catch (error) {
    console.log(error);

    throw error;
  }
};

// Method to update doctor's rating based on reviews
DoctorSchema.methods.updateRating = async function () {
  try {
    const reviews = await Review.find({ doctor: this._id });
    if (reviews.length === 0) return;
    const avgRating =
      reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    this.rating = avgRating;
    await this.save();
  } catch (error) {
    throw error;
  }
};
DoctorSchema.statics.addCompletedAppointment = async function (
  docId,
  upcomingAppointmentId,
  completedAppointmentId
) {
  try {
    // Find the docotor by ID
    const docotor = await this.findById(docId);

    if (!docotor) {
      throw new Error("docotor not found.");
    }

    // Remove the upcoming appointment from the docotor's upcomingAppointments array
    const updatedUpcomingAppointments = docotor.upcomingAppointments.filter(
      (appointment) => !appointment.equals(upcomingAppointmentId)
    );
    docotor.upcomingAppointments = updatedUpcomingAppointments;

    // Remove the upcoming appointment document from the UpcomingAppointment collection
    await UpcomingAppointment.findByIdAndDelete(upcomingAppointmentId);

    // Add the completed appointment to the completedAppointments array
    docotor.completedAppointments.push(completedAppointmentId);

    // Save the updated docotor document
    await docotor.save();

    return docotor;
  } catch (error) {
    throw new Error(error.message);
  }
};

DoctorSchema.statics.addUpcomingAppointment = async function (
  docId,
  appointmentId
) {
  try {
    // Find the docotor by ID
    const doctor = await this.findOne({ _id: docId });
 

    if (!doctor) {
      throw new Error("Doctor not found.");
    }

    // Add the appointment to the upcomingAppointments array
    doctor.upcomingAppointments.push(appointmentId);

    // Save the updated docotor document
    await doctor.save();


    return doctor;
  } catch (error) {
    throw new Error(error.message);
  }
};
const Doctor = mongoose.model("Doctor", DoctorSchema);

module.exports = Doctor;
