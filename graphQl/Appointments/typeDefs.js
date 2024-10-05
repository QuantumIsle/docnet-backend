// typeDefs.js

const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date
  # Type for CompletedAppointment, extending the base Appointment
  type CompletedAppointment {
    id: ID!
    docId: Doctor!
    patientId: Patient!
    date: Date!
    reason: String
    notes: String
    prescription: [String]
    appointmentType: String!
    outcome: String
    reportRequest: Report
    followUpDate: String
    createdAt: Date!
    updatedAt: Date!
  }

  # Type for UpcomingAppointment, extending the base Appointment
  type UpcomingAppointment {
    id: ID!
    docId: Doctor!
    patientId: Patient!
    date: Date!
    reason: String
    notes: String
    prescription: [String]
    appointmentType: String!
    reminderSent: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }

  # Queries for fetching appointments
  type Query {
    getCompletedAppointments: [CompletedAppointment]
    getCompletedAppointmentById(id: ID!): CompletedAppointment
    getUpcomingAppointments: [UpcomingAppointment]
    getUpcomingAppointmentById(id: ID!): UpcomingAppointment
  }
`;

module.exports = typeDefs;
