const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  deadline: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  assignedUser: { type: String, default: '' },
  assignedUserName: { type: String, default: 'unassigned' },
  dateCreated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
