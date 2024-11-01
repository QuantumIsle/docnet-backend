const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for Admins
const AdminSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "admin",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create the Admin model from the schema
const Admin = mongoose.model("Admin", AdminSchema);

// Export the Admin model
module.exports = Admin;
