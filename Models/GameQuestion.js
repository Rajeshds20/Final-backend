const mongoose = require('mongoose');

// Game Question Schema
const gameQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [
        {
            type: String,
            required: true
        }
    ],
    correctAnswer: {
        type: String,
        required: true
    }
});

// Game Question Model
const GameQuestion = mongoose.model('GameQuestion', gameQuestionSchema);
module.exports = GameQuestion;