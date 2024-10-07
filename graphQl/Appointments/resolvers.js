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
        return await CompletedAppointment.find({ _id: id })
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
        console.log(id);

        // Check if the provided ID is for an appointment or a doctor
        let appointments;

        // If the ID is an appointment ID
        if (await UpcomingAppointment.exists({ _id: id })) {
          // Find appointment by appointment ID
          console.log("valid id ");
          appointments = await UpcomingAppointment.find({ _id: id })
            .populate("docId") // Populate doctor information
            .populate("patientId"); // Populate patient information
        } else {
          // Otherwise, assume it's a doctor ID and find appointments for the doctor
          appointments = await UpcomingAppointment.find({ docId: id })
            .populate("docId") // Populate doctor information
            .populate("patientId"); // Populate patient information
        }

        console.log(appointments);

        return appointments;
      } catch (error) {
        throw new Error("Error fetching upcoming appointments");
      }
    },
  },
};

module.exports = resolvers;
