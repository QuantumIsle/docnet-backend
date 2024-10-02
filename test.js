// const mongoose = require("mongoose");
// const Patient = require("./model/patientModel");
// require("dotenv").config();

// const MDB = process.env.MONGO_URI;

// // Dummy data for patients
// const dummyPatients = [
//   {
//     firstName: "John",
//     lastName: "Doe",
//     email: "johndoe@example.com",
//     password: "123", // Will be hashed by the middleware
//     dateOfBirth: new Date("1990-05-12"),
//     gender: "male",
//     languagesSpoken: ["English", "Spanish"],
//     ethnicity: "Caucasian",
//     existingConditions: "Hypertension",
//     weight: 75,
//     height: 180,
//     bloodType: "O+",
//     timeZone: "America/New_York",
//     imgUrl: "https://example.com/img/johndoe.jpg",
//   },
//   {
//     firstName: "Jane",
//     lastName: "Smith",
//     email: "janesmith@example.com",
//     password: "123", // Will be hashed by the middleware
//     dateOfBirth: new Date("1985-08-23"),
//     gender: "female",
//     languagesSpoken: ["English", "French"],
//     ethnicity: "African American",
//     existingConditions: "Asthma",
//     weight: 68,
//     height: 170,
//     bloodType: "A+",
//     timeZone: "Europe/Paris",
//     imgUrl: "https://example.com/img/janesmith.jpg",
//   },
//   {
//     firstName: "Mike",
//     lastName: "Johnson",
//     email: "mikejohnson@example.com",
//     password: "123", // Will be hashed by the middleware
//     dateOfBirth: new Date("1975-11-04"),
//     gender: "male",
//     languagesSpoken: ["English"],
//     ethnicity: "Asian",
//     existingConditions: "Diabetes",
//     weight: 85,
//     height: 175,
//     bloodType: "B+",
//     timeZone: "Asia/Singapore",
//     imgUrl: "https://example.com/img/mikejohnson.jpg",
//   },
//   {
//     firstName: "Emily",
//     lastName: "Davis",
//     email: "emilydavis@example.com",
//     password: "123", // Will be hashed by the middleware
//     dateOfBirth: new Date("1992-01-16"),
//     gender: "female",
//     languagesSpoken: ["English", "German"],
//     ethnicity: "Hispanic",
//     existingConditions: "None",
//     weight: 55,
//     height: 160,
//     bloodType: "AB-",
//     timeZone: "Europe/Berlin",
//     imgUrl: "https://example.com/img/emilydavis.jpg",
//   },
// ];

// // Function to add patients to the database
// const addPatients = async () => {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(MDB, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log("Connected to MongoDB");

//     // Add each patient one by one
//     for (const patientData of dummyPatients) {
//       try {
//         const newPatient = await Patient.addPatient(patientData);
//         console.log(
//           `New patient added: ${newPatient.firstName} ${newPatient.lastName}`
//         );
//       } catch (error) {
//         console.error(
//           `Error adding patient ${patientData.firstName} ${patientData.lastName}: ${error.message}`
//         );
//       }
//     }

//     mongoose.connection.close(); // Close the MongoDB connection after adding all patients
//     console.log("All patients processed.");
//   } catch (error) {
//     console.error("Error connecting to MongoDB:", error.message);
//     mongoose.connection.close(); // Ensure the connection is closed in case of error
//   }
// };

// // Call the function to add the patients
// addPatients();

// const moment = require("moment-timezone");

// /**
//  * Converts a given time from UTC to a specific time zone.
//  *
//  * @param {string} utcTime - The time in UTC (format: HH:mm or any valid time format).
//  * @param {string} targetTimeZone - The target time zone (e.g., "America/New_York").
//  * @param {string} format - Optional. The desired output format (e.g., "hh:mm A" for 12-hour with AM/PM).
//  *                          Default is "hh:mm A".
//  * @returns {string} The converted time in the target time zone.
//  */
// const convertUtcToTimeZone = (utcTime, targetTimeZone, format = "hh:mm A") => {
//   // Ensure the time is treated as UTC and then convert to the target time zone
//   const convertedTime = moment.utc(utcTime, "HH:mm").tz(targetTimeZone);

//   // Return the time in the desired format
//   return convertedTime.format(format);
// };

// const utcTime2 = "14:28"; // 9:30 AM UTC
// const targetTimeZone2 = "Asia/Tokyo";
// const formattedTime = convertUtcToTimeZone(utcTime2, targetTimeZone2);

// console.log(`The time in ${targetTimeZone2} is: ${formattedTime}`);
// Output: The time in Asia/Tokyo is: 06:30 PM

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function testReportUpload() {
  try {
    const formData = new FormData();

    // Add file to form data (update path to point to an actual file on your system)
    const filePath = path.join(__dirname, "1.png");
    console.log(filePath);
    
    formData.append("report", fs.createReadStream(filePath));

    // Make the POST request to the URL
    const response = await axios.post(
      "http://localhost:3000/patients/report-upload",
      formData,
      {
        headers: {
          ...formData.getHeaders(), // Ensure proper headers are set
        },
      }
    );

    console.log("File uploaded successfully:", response.data);
  } catch (error) {
    console.error(
      "Error uploading file:",
      error.response ? error.response.data : error.message
    );
  }
}

// Call the function to run the test
testReportUpload();
