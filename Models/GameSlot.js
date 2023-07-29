const mongoose = require('mongoose');

// Game Slot Schema
const gameSlotSchema = new mongoose.Schema({
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    maximumCapacity: {
        type: Number,
        default: 10
    },
    currentMembers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'USER'
        }
    ],
    quizQuestions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GameQuestion'
        }
    ],
    quizResults: [
        {
            participant: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'USER'
            },
            points: {
                type: Number,
                default: 0
            },
            timeTaken: {
                type: Number,
                default: 0
            },
            position: {
                type: Number
            },
            rewardPoints: {
                type: Number
            },
        }
    ],
    status: {
        type: String,
        enum: ['active', 'started', 'completed'],
        default: 'active'
    },
});

// Game Slot Model
const GameSlot = mongoose.model('GameSlot', gameSlotSchema);
module.exports = GameSlot;