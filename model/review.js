const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for reviews
const ReviewSchema = new Schema({
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: "Doctor", // Reference to the Doctor model
    required: true,
  },
  patientId: {
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
    const doctor = await require("./doctorModel").findByIdAndUpdate(
      reviewData.doctor,
      {
        $push: { reviews: newReview._id },
      }
    );

    // Update the doctor's rating

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
