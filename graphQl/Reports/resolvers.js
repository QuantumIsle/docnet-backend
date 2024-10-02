const Report = require("../../model/reportsModel"); // Assuming the model is in the models folder

const resolvers = {
  Query: {
    // Fetch reports by doctorId and populate patientId
    getReportsByDoctorId: async (_, __, context) => {
      try {
        const doctorId = context.user;
        return await Report.getReportsByDoctorId(doctorId);
      } catch (error) {
        throw new Error(error.message);
      }
    },

    // Fetch reports by patientId and populate doctorId
    getReportsByPatientId: async (_, __, context) => {
      try {
        const patientId = context.user;
        return await Report.getReportsByPatientId(patientId);
      } catch (error) {
        throw new Error(error.message);
      }
    },

    // Fetch a report by its ID
    getReportById: async (_, { id }) => {
      try {
        return await Report.getReportById(id);
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};

module.exports = resolvers;
