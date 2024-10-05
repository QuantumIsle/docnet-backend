const CompletedAppointment = require("../../model/appointments/CompletedAppointmentModel");
const UpcomingAppointment = require("../../model/appointments/UpcomingAppointmentModel");

const resolvers = {
  Query: {
    getCompletedAppointments: async () => {
      try {
        return await CompletedAppointment.find()
          .populate("docId")
          .populate("patientId");
      } catch (error) {
        throw new Error("Error fetching completed appointments");
      }
    },
    getCompletedAppointmentById: async (_, { id }) => {
      try {
        // Populate doctor and patient fields
        return await CompletedAppointment.findOne({ _id: id })
          .populate("docId") // Populate doctor information
          .populate("patientId"); // Populate patient information
      } catch (error) {
        throw new Error("Error fetching completed appointment");
      }
    },
    getUpcomingAppointments: async () => {
      try {
        return await UpcomingAppointment.find()
          .populate("docId")
          .populate("patientId");
      } catch (error) {
        throw new Error("Error fetching upcoming appointments");
      }
    },
    getUpcomingAppointmentById: async (_, { id }) => {
      try {
        // Find all upcoming appointments for the given doctor ID and populate related fields
        const appointments = await UpcomingAppointment.findOne({ _id: id })
          .populate("docId") // Populate doctor information
          .populate("patientId"); // Populate patient information

        console.log(appointments);

        return appointments;
      } catch (error) {
        throw new Error("Error fetching upcoming appointments");
      }
    },
  },
};

module.exports = resolvers;
