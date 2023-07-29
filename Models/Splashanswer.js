const mongoose = require('mongoose');

const SplashansSchema = new mongoose.Schema({
    selected: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
        required: true
    },
    selectedby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
        required: true
    },
    time: {
        type: Date,
        required: true
    },
    Question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Splash',
        required: true

    },
    showsplash: {
        type: Boolean,
        default: 'false'
    }

})

const Splashanswer = new mongoose.model("Splashans", SplashansSchema);
module.exports = Splashanswer;