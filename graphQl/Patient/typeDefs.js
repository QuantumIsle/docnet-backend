const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date

  type Patient {
    id: ID!
    firstName: String!
    lastName: String!
    dateOfBirth: Date
    gender: String
    languagesSpoken: [String]
    email: String!
    googleId: String
    ethnicity: String
    existingConditions: String
    weight: Float
    height: Float
    bloodType: String
    imgUrl: String
    timeZone: String
    appointments: [Appointment]
    reports: [Report]
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getPatient: Patient
    getPatientById(id: ID!): Patient
    getAllPatients: [Patient!]
  }

  type Mutation {
    updatePatient(
      id: ID!
      firstName: String
      lastName: String
      dateOfBirth: Date
      gender: String
      languagesSpoken: [String]
      email: String
      googleId: String
      ethnicity: String
      existingConditions: String
      weight: Float
      height: Float
      bloodType: String
      imgUrl: String
      timeZone: String
    ): Patient
  }
`;

module.exports = typeDefs;
