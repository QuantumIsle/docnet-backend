const Doctor = require("../../model/doctorModel");

const resolvers = {
  Query: {
    getAllDoctors: async () => {
      const data = await Doctor.getAllDoctors();
      return data;
    },
    getDoctorById: async (_, { id }, context) => {
      
      if (id) {
        console.log(id);
        const data = await Doctor.getDoctorByID(id);
        return data;
      }
      return await Doctor.getDoctorByID(context.user);
    },
  },
};

module.exports = resolvers;
