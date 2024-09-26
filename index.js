const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const authRoutes = require("./routes/authRoutes");
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
const AppointmentResolvers = require("./graphQl/Appointments/resolvers");
const app = express();

const auth = require("./authentication/patientAuth");

const SDK_KEY = process.env.SDK_KEY;
const SDK_SECRET = process.env.SDK_SECRET;

const corsOptions = {
  origin: "http://localhost:5173", // React frontend's URL
  credentials: true, // Allow cookies (credentials) to be sent and received
};

// Use CORS to allow cross-origin requests
app.use(cors(corsOptions));

// Add cookie-parser middleware
app.use(cookieParser());
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
app.use("/", authRoutes);

// Routes
app.use("/patients", require("./routes/patientRoutes"));
app.use("/doctors", require("./routes/doctorRoutes"));

// Signature route
// app.get("/signature", (req, res) => {
//   const iat = Math.round(new Date().getTime() / 1000) - 30;
//   const exp = iat + 60 * 60 * 2;
//   const oHeader = { alg: "HS256", typ: "JWT" };

//   const oPayload = {
//     app_key: SDK_KEY,
//     tpc: "test",
//     role_type: 1,
//     version: 1,
//     iat: iat,
//     exp: exp,
//   };

//   const sdkJWT = jwt.sign(oPayload, SDK_SECRET, {
//     algorithm: "HS256",
//     header: oHeader,
//   });

//   res.send(sdkJWT);
// });


const authRoute = require("./routes/authRoutes");

app.use("/auth", authRoute);

app.use(auth);

// Apollo Server setup
const server = new ApolloServer({
  typeDefs: [patientTypeDefs, DoctorTypeDefs, AppointmentTypeDefs],
  resolvers: [patientResolvers, DoctorResolvers, AppointmentResolvers],
  context: ({ req }) => {
    return { user: req.user }; 
  },
});

server.start().then(() => {
  server.applyMiddleware({ app, cors: false });

  mongoose
    .connect(MDB, { useNewUrlParser: true, useUnifiedTopology: true })
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
