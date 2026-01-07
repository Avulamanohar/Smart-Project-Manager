const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deadline: { type: Date },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed'],
        default: 'active'
    },
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
