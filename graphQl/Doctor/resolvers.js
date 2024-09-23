const Doctor = require("../../model/doctorModel");
const Review = require("../../model/review/review");

const resolvers = {
  Query: {
    getAllDoctors: async () => {
      const data = await Doctor.getAllDoctors();
      return data;
    },
    getDoctorById: async (_, { id }) => {
      const data = await Doctor.getDoctorByID(id);
      return data;
    },
  },
  Mutation: {
    addDoctor: async (_, args) => {
      const newDoctor = await Doctor.addDoctor(args);
      return newDoctor;
    },
    updateDoctorRating: async (_, { id }) => {
      const doctor = await Doctor.findById(id);
      if (!doctor) throw new Error("Doctor not found");
      await doctor.updateRating();
      return doctor;
    },
  },
  Doctor: {
    reviews: async (doctor) => {
      return await Review.find({ doctor: doctor.id });
    },
  },
};

module.exports = resolvers;
