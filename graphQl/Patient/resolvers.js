// resolvers.js

const Patient = require("../../model/patientModel"); // Import the Patient model

const resolvers = {
  Query: {
    getPatient: async (_, __, context) => {
      try {
        const user = context.user;
        const patient = await Patient.findOne({ _id: user })
          .populate({
            path: "appointments",
            populate: {
              path: "doctorId", // Path to doctor reference in Appointment
            },
          })
          .populate({
            path: "reviews",
            populate: {
              path: "doctorId",
            },
          })
          .populate({
            path: "reports",
            populate: {
              path: "doctorId",
            },
          });

        return patient;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    getPatientById: async (_, { id }, __) => {
      try {
        const patient = await Patient.findOne({ _id: id })
          .populate({
            path: "appointments",
            populate: [
              {
                path: "doctorId",
              },
              {
                path: "outcome.reportRequest", 
                model: "Report", 
              },
            ],
          })
          .populate({
            path: "reviews",
            populate: {
              path: "doctorId",
            },
          })
          .populate({
            path: "reports",
            populate: {
              path: "doctorId",
            },
          });
    
        return patient;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    
    getAllPatients: async () => {
      try {
        const patients = await Patient.find({})
          .populate({
            path: "appointments",
            populate: {
              path: "doctorId", // Path to doctor reference in Appointment
            },
          })
          .populate({
            path: "reviews",
            populate: {
              path: "doctorId",
            },
          })
          .populate({
            path: "reports",
            populate: {
              path: "doctorId",
            },
          });
        return patients;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
  Mutation: {
    updatePatient: async (_, { id, ...updateData }, context) => {
      try {
        // Find the patient by ID and update the fields provided in the updateData
        const updatedPatient = await Patient.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        );

        if (!updatedPatient) {
          throw new Error("Patient not found");
        }

        return updatedPatient;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};

module.exports = resolvers;
