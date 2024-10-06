const moment = require("moment-timezone");

const convertUtcToTimeZone = (time, timeZone) => {
  return moment.utc(time, "HH:mm").tz(timeZone).format("HH:mm");
};

const generateTimeSlots = (startTime, endTime, timeZone) => {
  const slots = [];
  const format = "HH:mm"; // Format for the input UTC time

  const start = moment.utc(startTime, format); // Parse the start time as UTC
  let end = moment.utc(endTime, format); // Parse the end time as UTC

  // If endTime is earlier than startTime, treat endTime as on the next day
  if (end.isBefore(start)) {
    end.add(1, "day");
  }

  let current = start.clone();

  // Generate 30-minute time slots
  while (current.isBefore(end)) {
    // Convert each slot from UTC to the patient's time zone
    const slotInPatientTimeZone = convertUtcToTimeZone(
      current.format(format),
      timeZone
    );
    slots.push(slotInPatientTimeZone);

    current = current.add(30, "minutes");
  }

  console.log("Generated time slots:", slots);
  return slots;
};

console.log(generateTimeSlots("15:00", "01:00", "America/New_York"));
