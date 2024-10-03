const Doctor = require("../../model/doctorModel");

const resolvers = {
  Query: {
    getAllDoctors: async () => {
      const data = await Doctor.getAllDoctors();
      return data;
    },
    getDoctorById: async (_, { id }, context) => {
      if (id) {
        const data = await Doctor.getDoctorByID(id);
        return data;
      }
      return await Doctor.getDoctorByID(context.user);
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
