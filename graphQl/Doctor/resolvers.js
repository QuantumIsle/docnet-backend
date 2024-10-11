const Doctor = require("../../model/doctorModel");

const resolvers = {
  Query: {
    getDoctor: async (_, __, context) => {
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
        })
        .populate({
          path: "reports",
          populate: {
            path: "patientId",
          },
        });
      return data;
    },
    getDoctorById: async (_, { id }, __) => {
      const data = await Doctor.findOne({ _id: id })
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
        })
        .populate({
          path: "reports",
          populate: {
            path: "patientId",
          },
        });
      console.log(data);

      return data;
    },
    getAllDoctors: async () => {
      let data = await Doctor.find()
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
      data = data.filter((doctor) => !doctor.verified);
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
