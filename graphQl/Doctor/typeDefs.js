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
    specialization: String!
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

  # Patient Type Definition (assumed based on usage in reviews)
  type Patient {
    id: ID!
    firstName: String!
    lastName: String!
    imgUrl: String
  }

  # Query Type Definition
  type Query {
    getAllDoctors: [Doctor!]!
    getDoctorById(id: ID!): Doctor
  }

  # Mutation Type Definition
  type Mutation {
    addDoctor(
      firstName: String!
      lastName: String!
      imageUrl: String
      dateOfBirth: Date!
      gender: String!
      email: String!
      password: String!
      specialization: String!
      contactNumber: String!
      about: String!
      timeZone: String
      qualifications: [String!]!
      professionalBackground: String!
      professionStartedYear: Int!
      languagesSpoken: String
      workingHours: WorkingHoursInput!
    ): Doctor

    updateDoctorRating(id: ID!): Doctor
  }

  # Input Type for Working Hours
  input WorkingHoursInput {
    startTime: String!
    endTime: String!
  }
`;

module.exports = typeDefs;
