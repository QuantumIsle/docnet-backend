const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const auth = require("../authentication/patientAuth");

//patient booking routes
router.post("/booking", auth, appointmentController.addUpcomingAppointment);
router.post("/complete", auth, appointmentController.addCompletedAppointment);
router.post("/cancel",  appointmentController.cancelAppointment);

module.exports = router;
