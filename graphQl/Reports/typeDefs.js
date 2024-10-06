const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date
  type Report {
    id: ID!
    doctorId: Doctor!
    patientId: Patient!
    appointmentId: CompletedAppointment
    reportType: String
    review: String
    fileUrl: String
    status: String
    createdAt: Date!
    updatedAt: Date
  }

  type Query {
    getReportsByDoctorId: [Report]
    getReportsByPatientId: [Report]
    getReportById(id: ID!): Report
  }
`;

module.exports = typeDefs;
