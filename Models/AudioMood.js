const mongoose = require('mongoose');

const AudioMoodSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    Mood: {
        type: String,
        enum: ['Motivated', 'Tired', 'Stressed', 'Panicked', 'Lazy', 'Angry'],
        required: true
    }
})

const AudioMood = new mongoose.model("AudioMood", AudioMoodSchema);
module.exports = AudioMood;