const Doctor = require("../../model/doctorModel");

const resolvers = {
  Query: {
    getAllDoctors: async () => {
      const data = await Doctor.find()
        .populate({
          path: "reviews",
          populate: {
            path: "patientId",
            select: "firstName lastName imgUrl", // Populate user details in reviews
          },
        })
        .populate({
          path: "appointments",
          populate: {
            path: "patientId",
          },
        });
      return data;
    },
    getDoctorById: async (_, __, context) => {
      const data = await Doctor.findOne({ _id: context.user })
        .populate({
          path: "reviews",
          populate: {
            path: "patientId",
            select: "firstName lastName imgUrl", // Populate user details in reviews
          },
        })
        .populate({
          path: "appointments",
          populate: {
            path: "patientId",
          },
        });
      return data;
    },
  },

  Mutation: {
    updateDoctor: async (_, { id, ...updateData }) => {
      try {
        // Find the doctor by ID and update the fields passed in updateData
        const updatedDoctor = await Doctor.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
          throw new Error("Doctor not found");
        }

        return updatedDoctor;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};

module.exports = resolvers;
