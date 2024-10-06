// typeDefs.js

const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date
  # Type for CompletedAppointment, extending the base Appointment
  type CompletedAppointment {
    id: ID
    docId: Doctor # Reference to the Doctor type
    patientId: Patient # Reference to the Patient type
    date: Date # Timestamp of the appointment
    reason: String # Reason for the appointment (optional)
    notes: String # General notes (optional)
    outcome: Outcome # Outcome details, including diagnosis and reports
    createdAt: Date # Timestamp of when the appointment was created
    updatedAt: Date # Timestamp of when the appointment was last updated
  }

  type Prescription {
    medicine: String!
    howToUse: String!
  }

  type Outcome {
    diagnosis: String! # The diagnosis from the appointment
    prescription:[Prescription]!
    notes: String # Additional notes related to the outcome (optional)
    reportRequest: [Report] # List of report requests related to the outcome
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
    getCompletedAppointmentById(id: ID!): [CompletedAppointment]
    getUpcomingAppointments: [UpcomingAppointment]
    getUpcomingAppointmentById(id: ID!): [UpcomingAppointment]
  }
`;

module.exports = typeDefs;
