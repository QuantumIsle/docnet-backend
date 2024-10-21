const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for Admins
const AdminSchema = new Schema(
  
);


const Admin = mongoose.model("Admin", AdminSchema);

// Export the Admin model
module.exports = Admin;
