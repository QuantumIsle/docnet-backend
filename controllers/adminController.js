const Doctor = require("../model/doctorModel");
const Patient = require("../model/patientModel");

exports.requestCertificates = async (req, res) => {
  const { doctorId, certificates } = req.body;
  console.log(certificates);

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Update requested certificates
    doctor.certificates = certificates;

    await doctor.save();
    res.status(200).json({ message: "Certificate request submitted", doctor });
  } catch (error) {
    console.error("Error requesting certificates:", error);
    res.status(500).json({ message: "Error submitting certificate request" });
  }
};
