const moment = require("moment-timezone");
const ct = require("countries-and-timezones");
const readline = require("readline");

// Get all available countries
const countries = ct.getAllCountries();

// Print all countries with their codes
console.log("Available Countries:");
Object.keys(countries).forEach(countryCode => {
  console.log(`Country Code: ${countryCode}, Country Name: ${countries[countryCode].name}`);
});

// Set up a prompt to get user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\nEnter a country code to see its time zones (e.g., 'US' for the United States): ", (countryCode) => {
  if (countries[countryCode]) {
    // Get time zones for the specified country
    const timeZones = ct.getTimezonesForCountry(countryCode);
    console.log(`\nTime zones in ${countries[countryCode].name}:`);

    // Loop through each time zone and display the current time
    timeZones.forEach(timeZone => {
      const currentTime = moment.tz(timeZone.name).format("YYYY-MM-DD HH:mm:ss");
      console.log(`- ${timeZone.name} (UTC Offset: ${timeZone.utcOffsetStr}): Current Time: ${currentTime}`);
    });
  } else {
    console.log("Invalid country code. Please try again.");
  }
  rl.close();
});
