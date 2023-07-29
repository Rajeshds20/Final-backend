const mongoose = require('mongoose');

const AudioSchema = new mongoose.Schema({

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

const Audio = new mongoose.model("Audio", AudioSchema);
module.exports = Audio;