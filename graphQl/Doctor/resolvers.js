const Doctor = require("../../model/doctorModel");
const Review = require("../../model/review/review");

const resolvers = {
  Query: {
    getAllDoctors: async () => {
      const data = await Doctor.getAllDoctors();
      return data;
    },
    getDoctorById: async (_, { id }, context) => {
      if (id) {
        return await Doctor.getDoctorByID(id);
      }
      return await Doctor.getDoctorByID(context.user);
    },
  },
};

module.exports = resolvers;
