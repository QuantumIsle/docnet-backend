const Doctor = require("../model/doctorModel");
const Patient = require("../model/patientModel");

exports.requestCertificates = async (req, res) => {
  const { doctorId, certificates } = req.body;

  console.log(req.body);

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
exports.acceptOrRejectCertificates = async (req, res) => {
  const { doctorId, certificateId, accept } = req.body;
  console.log(req.body);

  try {
    // Find the doctor by ID
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Find the specific certificate in the doctor's certificates array
    const certificate = doctor.certificates.find(
      (cert) => cert._id.toString() === certificateId
    );
    if (!certificate) {
      return res
        .status(404)
        .json({ message: "Certificate not found in doctor's profile" });
    }

    if (accept == "1") {
      certificate.valid = true;
    } else {
      certificate.valid = false;
    }

    // Save the doctor document with the updated certificate
    await doctor.save();

    res.status(200).json({ message: "Certificate Validated", doctor });
  } catch (error) {
    console.error("Error validating certificate:", error);
    res
      .status(500)
      .json({ message: "Error submitting certificate validation request" });
  }
};

exports.acceptOrRejectDoctor = async (req, res) => {
  const { doctorId, accept } = req.body;

  console.log(req.body);

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Set the verified status based on the accept parameter
    doctor.verified = accept === "1";

    await doctor.save();
    res.status(200).json({ message: accept === "1" ? "Doctor accepted" : "Doctor rejected", doctor });
  } catch (error) {
    console.error("Error updating doctor verification status:", error);
    res.status(500).json({ message: "Error updating verification status" });
  }
};

