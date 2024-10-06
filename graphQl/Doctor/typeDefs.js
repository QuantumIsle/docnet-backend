const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date

  # Doctor Type Definition
  type Doctor {
    id: ID!
    firstName: String!
    lastName: String!
    imageUrl: String
    dateOfBirth: Date!
    gender: String!
    email: String!
    specialization: String
    contactNumber: String!
    videoVisitHours: Int
    about: String!
    timeZone: String
    qualifications: [String!]!
    professionalBackground: String!
    rating: Float
    professionStartedYear: Int
    languagesSpoken: String
    workingHours: WorkingHours!
    completedAppointments: [CompletedAppointment]
    upcomingAppointments: [UpcomingAppointment]
    reviews: [Review]
    createdAt: Date!
    updatedAt: Date!
  }

  # Working Hours Type Definition
  type WorkingHours {
    startTime: String!
    endTime: String!
  }

  # Review Type Definition
  type Review {
    id: ID
    user: Patient
    doctor: Doctor
    rating: Float!
    comment: String!
    createdAt: Date!
    updatedAt: Date!
  }

  # Mutation for updating doctor details
  type Mutation {
    updateDoctor(
      id: ID!
      firstName: String
      lastName: String
      imageUrl: String
      dateOfBirth: Date
      gender: String
      email: String
      specialization: String
      contactNumber: String
      videoVisitHours: Int
      about: String
      timeZone: String
      qualifications: [String]
      professionalBackground: String
      professionStartedYear: Int
      languagesSpoken: String
      workingHours: WorkingHoursInput
    ): Doctor
  }

  # Working Hours Input for mutation
  input WorkingHoursInput {
    startTime: String!
    endTime: String!
  }

  # Query Type Definition
  type Query {
    getAllDoctors: [Doctor!]!
    getDoctorById(id: ID): Doctor
  }
`;

module.exports = typeDefs;
