// typeDefs.js

const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date
  # Type for CompletedAppointment, extending the base Appointment
  type CompletedAppointment {
    id: ID!
    docId: Doctor!
    patientId: ID!
    date: Date!
    reason: String
    notes: String
    prescription: [String]
    appointmentType: String!
    outcome: String
    followUpDate: String
    createdAt: String!
    updatedAt: String!
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
    createdAt: String!
    updatedAt: String!
  }

  # Input type for creating/updating completed appointments
  input CompletedAppointmentInput {
    docId: ID!
    patientId: ID!
    date: Date!
    reason: String
    notes: String
    prescription: [String]
    outcome: String
    followUpDate: String
  }

  # Input type for creating/updating upcoming appointments
  input UpcomingAppointmentInput {
    docId: ID!
    patientId: ID!
    date: Date!
    reason: String
    notes: String
    prescription: [String]
    reminderSent: Boolean
  }

  # Queries for fetching appointments
  type Query {
    getCompletedAppointments: [CompletedAppointment]
    getCompletedAppointmentById(id: ID!): CompletedAppointment
    getUpcomingAppointments: [UpcomingAppointment]
    getUpcomingAppointmentById(id: ID!): [UpcomingAppointment]
  }

  # Mutations for creating and updating appointments
  type Mutation {
    createCompletedAppointment(
      input: CompletedAppointmentInput!
    ): CompletedAppointment
    createUpcomingAppointment(
      input: UpcomingAppointmentInput!
    ): UpcomingAppointment
    updateCompletedAppointment(
      id: ID!
      input: CompletedAppointmentInput!
    ): CompletedAppointment
    updateUpcomingAppointment(
      id: ID!
      input: UpcomingAppointmentInput!
    ): UpcomingAppointment
  }
`;

module.exports = typeDefs;
