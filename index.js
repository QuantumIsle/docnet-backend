const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const jwt = require("jsonwebtoken");

const paymentController = require("./controllers/paymentController");

require("./config/passportSetup"); // Import Passport configuration

require("dotenv").config();

const cookieParser = require("cookie-parser");

// Add cookie-parser middleware

const MDB = process.env.MONGO_URI;

const patientTypeDefs = require("./graphQl/Patient/typeDefs");
const patientResolvers = require("./graphQl/Patient/resolvers");

const DoctorTypeDefs = require("./graphQl/Doctor/typeDefs");
const DoctorResolvers = require("./graphQl/Doctor/resolvers");

const AppointmentTypeDefs = require("./graphQl/Appointments/typeDefs");

const ReportTypeDefs = require("./graphQl/Reports/typeDefs");

const app = express();

const auth = require("./authentication/patientAuth");

const SDK_KEY = process.env.SDK_KEY;
const SDK_SECRET = process.env.SDK_SECRET;

const corsOptions = {
  origin: process.env.FRONTEND_URL, // React frontend's URL
  credentials: true, // Allow cookies (credentials) to be sent and received
};

// Use CORS to allow cross-origin requests
app.use(cors(corsOptions));

// Add cookie-parser middleware
app.use(cookieParser());


//Just need to keep it before making app.use bodyParser.json
app.use("/payments/webhook", bodyParser.raw({ type: "application/json" }), paymentController.handleStripeWebhook);

// Use body-parser to parse JSON bodies into JS objects
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", require("./routes/authRoutes"));

// Routes
app.use("/appointments", require("./routes/appointmentRoutes"));
app.use("/patients", require("./routes/patientRoutes"));
app.use("/doctors", require("./routes/doctorRoutes"));
app.use("/admins", require("./routes/adminRoutes"));
app.use("/payments", require("./routes/paymentRoutes"));
app.use(auth);

const Doctor = require("./model/doctorModel");
const Patient = require("./model/patientModel");

app.get("/signature", async (req, res) => {
  const { id } = req.query; // Get the appointmentId from query parameters

  try {
    // Get the user ID from req.user (populated by your auth middleware)
    const userId = req.user;

    // Check if the user is a doctor or patient
    let isDoctor = false;
    let isPatient = false;
    let role_type = 1; // Default role type

    // First, check if the user is a doctor
    const doctor = await Doctor.findById(userId);
    if (doctor) {
      isDoctor = true;
      role_type = 0; // Role type for host (doctor)
    }

    // If not a doctor, check if the user is a patient
    if (!isDoctor) {
      const patient = await Patient.findById(userId);
      if (patient) {
        isPatient = true;
        role_type = 1; // Role type for participant (patient)
      }
    }

    // If the user is neither a doctor nor a patient, handle it appropriately
    if (!isDoctor && !isPatient) {
      return res.status(400).send("User not found in the system.");
    }

    // Prepare JWT payload
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2-hour expiry
    const oHeader = { alg: "HS256", typ: "JWT" };
    const oPayload = {
      app_key: SDK_KEY,
      tpc: id, // Use the appointmentId as the unique meeting identifier
      role_type: role_type, // Host (doctor) or participant (patient)
      version: 1,
      iat: iat,
      exp: exp,
    };

    // Sign the JWT
    const sdkJWT = jwt.sign(oPayload, SDK_SECRET, {
      algorithm: "HS256",
      header: oHeader,
    });

    res.send(sdkJWT);
  } catch (error) {
    console.log("Error in /signature route:", error);
    res.status(500).send("Internal server error");
  }
});

// Apollo Server setup
const server = new ApolloServer({
  typeDefs: [
    patientTypeDefs,
    DoctorTypeDefs,
    AppointmentTypeDefs,
    ReportTypeDefs,
  ],
  resolvers: [patientResolvers, DoctorResolvers],
  context: ({ req }) => {
    return { user: req.user };
  },
});

server.start().then(() => {
  server.applyMiddleware({ app, cors: false });

  mongoose
    .connect(MDB)
    .then(() => {
      console.log("Connected to MongoDB");

      app.listen({ port: 4000 }, () => {
        console.log(
          "Server running on http://localhost:4000" + server.graphqlPath
        );
        console.log("REST API running on http://localhost:4000/");
      });
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB", err);
    });
});
