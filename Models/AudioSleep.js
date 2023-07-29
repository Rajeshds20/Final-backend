const mongoose = require('mongoose');

const SleepAudioSchema = new mongoose.Schema({

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
    }
})

const AudioSleep = new mongoose.model("AudioSleep", SleepAudioSchema);
module.exports = AudioSleep;