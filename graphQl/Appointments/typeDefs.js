// typeDefs.js

const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date

  # Type for Appointment, extending the base Appointment
  type Appointment {
    id: ID!
    doctorId: Doctor! # Reference to the Doctor type
    patientId: Patient! # Reference to the Patient type
    appointmentNumber: String!
    status: String!
    reason: String # Reason for the appointment (optional)
    notes: String # General notes (optional)
    outcome: Outcome # Outcome details, including diagnosis and reports
    appointmentDate: Date!
    completedAt: Date
    createdAt: Date # Timestamp of when the appointment was created
    updatedAt: Date # Timestamp of when the appointment was last updated
  }

  type Prescription {
    medicine: String!
    howToUse: String!
  }

  type Outcome {
    diagnosis: String! # The diagnosis from the appointment
    prescription: [Prescription]!
    notes: String # Additional notes related to the outcome (optional)
    reportRequest: [Report] # List of report requests related to the outcome
  }
`;

module.exports = typeDefs;
