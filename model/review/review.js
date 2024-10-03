const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Doctor = require("../doctorModel"); // Import the Doctor model

// Define the schema for reviews
const ReviewSchema = new Schema({
  doctor: {
    type: Schema.Types.ObjectId,
    ref: "Doctor", // Reference to the Doctor model
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "Patient", // Reference to the Patient model
    required: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Add a review
ReviewSchema.statics.addReview = async function (reviewData) {
  try {
    const newReview = new this(reviewData);
    await newReview.save();

    // After saving, add the review to the doctor's review array
    await Doctor.findByIdAndUpdate(reviewData.doctor, {
      $push: { reviews: newReview._id },
    });

    // Update the doctor's rating
    const doctor = await Doctor.findById(reviewData.doctor);
    if (doctor) {
      await doctor.updateRating();
    }

    return newReview;
  } catch (error) {
    throw error;
  }
};

const Review = mongoose.model("Review", ReviewSchema);

module.exports = Review;
