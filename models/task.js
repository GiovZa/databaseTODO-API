// Load required packages
const mongoose = require('mongoose');

// Define our task schema
const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: 'None'},
  deadline: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  assignedUser: { type: String, ref: 'User', default: '' },
  assignedUserName: { type: String, default: 'unassigned' },
  dateCreated: { type: Date, default: Date.now }
});

// Export the Mongoose model
module.exports = mongoose.model('Task', taskSchema);