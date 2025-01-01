const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date
  type Report {
    id: ID!
    doctorId: Doctor!
    patientId: Patient!
    appointmentId: Appointment
    reportType: String
    review: String
    fileUrl: String
    status: String
    createdAt: Date
    updatedAt: Date
  }

`;

module.exports = typeDefs;
