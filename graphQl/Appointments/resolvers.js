const CompletedAppointment = require("../../model/appointments/CompletedAppointmentModel");
const UpcomingAppointment = require("../../model/appointments/UpcomingAppointmentModel");

const resolvers = {
  Query: {
    getCompletedAppointments: async () => {
      try {
        return await CompletedAppointment.find();
      } catch (error) {
        throw new Error("Error fetching completed appointments");
      }
    },
    getCompletedAppointmentById: async (_, { id }) => {
      try {
        return await CompletedAppointment.find({ docId: id });
      } catch (error) {
        throw new Error("Error fetching completed appointment");
      }
    },
    getUpcomingAppointments: async () => {
      try {
        return await UpcomingAppointment.find();
      } catch (error) {
        throw new Error("Error fetching upcoming appointments");
      }
    },
    getUpcomingAppointmentById: async (_, { id }) => {
      try {
        // This will return all upcoming appointments for the given doctor ID
        const appointments = await UpcomingAppointment.find({ docId: id });

        return appointments;
      } catch (error) {
        throw new Error("Error fetching upcoming appointments");
      }
    },
  },

  Mutation: {
    createCompletedAppointment: async (_, { input }) => {
      try {
        const newCompletedAppointment = new CompletedAppointment(input);
        return await newCompletedAppointment.save();
      } catch (error) {
        throw new Error("Error creating completed appointment");
      }
    },
    createUpcomingAppointment: async (_, { input }) => {
      try {
        const newUpcomingAppointment = new UpcomingAppointment(input);
        return await newUpcomingAppointment.save();
      } catch (error) {
        throw new Error("Error creating upcoming appointment");
      }
    },
    updateCompletedAppointment: async (_, { id, input }) => {
      try {
        return await CompletedAppointment.findByIdAndUpdate(id, input, {
          new: true,
        });
      } catch (error) {
        throw new Error("Error updating completed appointment");
      }
    },
    updateUpcomingAppointment: async (_, { id, input }) => {
      try {
        return await UpcomingAppointment.findByIdAndUpdate(id, input, {
          new: true,
        });
      } catch (error) {
        throw new Error("Error updating upcoming appointment");
      }
    },
  },
};

module.exports = resolvers;
