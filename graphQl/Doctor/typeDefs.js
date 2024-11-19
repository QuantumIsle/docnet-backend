const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date

  type Doctor {
    id: ID!
    firstName: String!
    lastName: String!
    image: image
    dateOfBirth: Date!
    gender: String!
    email: String!
    specialization: String
    contactNumber: String
    videoVisitHours: Int
    about: String
    timeZone: String
    country: String
    qualifications: [String!]
    professionalBackground: String
    rating: Float
    certificates: [Certificates]
    professionStartedYear: Int
    verified: Boolean
    languagesSpoken: String
    workingHours: WorkingHours
    appointments: [Appointment]
    reviews: [Review]
    reports: [Report]
    createdAt: Date!
    updatedAt: Date!
  }
  type image {
    url: String
    publicId: ID
  }
  type Certificates {
    certificateName: String
    certificateDescription: String
    valid: String
    links: [String]
    id: ID!
  }

  # Working Hours Type Definition
  type WorkingHours {
    startTime: String
    endTime: String
  }

  # Review Type Definition
  type Review {
    id: ID!
    patientId: Patient!
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
      country: String
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
    getAllDoctors(verified: Boolean): [Doctor!]!
    getDoctor: Doctor
    getDoctorById(id: ID!): Doctor
  }
`;

module.exports = typeDefs;
