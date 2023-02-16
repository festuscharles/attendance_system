const mongoose = require('mongoose')
const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    tagId: {
        type: String,
        required: true,
        unique: true
    },
    attendance: { 
        type: Boolean, 
        default: false 
    },
    created: {
        type: Date,
        required: true,
        default: Date.now
    }
})
module.exports = mongoose.model('Student', studentSchema);