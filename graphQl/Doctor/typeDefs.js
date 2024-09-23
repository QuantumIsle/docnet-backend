// typeDefs.js

const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date
  # Doctor Type Definition
  type Doctor {
    id: ID!
    firstName: String
    lastName: String
    imageUrl: String
    dateOfBirth: String
    gender: String
    email: String
    specialization: String
    contactNumber: String
    videoVisitHours: Int
    about: String
    qualifications: [String]
    professionalBackground: String
    rating: Float
    professionStartedYear: Int
    languagesSpoken: String
    reviews: [Review]
    createdAt: String
    updatedAt: String
  }

  # Review Type Definition
  type Review {
    id: ID
    user: Patient
    doctor: Doctor
    rating: Float
    comment: String
    createdAt: String
    updatedAt: String
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
      dateOfBirth: String!
      gender: String!
      email: String!
      password: String!
      specialization: String!
      contactNumber: String!
      about: String!
      qualifications: [String!]!
      professionalBackground: String!

      professionStartedYear: Int!
      languagesSpoken: String
    ): Doctor

    # Update rating for a specific doctor
    updateDoctorRating(id: ID!): Doctor
  }
`;

module.exports = typeDefs;
