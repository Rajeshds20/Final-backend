const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Birthday: {
        day: {
            type: Number,
            required: true
        },
        month: {
            type: Number,
            required: true

        },
        year: {
            type: Number,
            required: true
        }
    },
    Gender: {
        type: String,
        required: true
    },
    Phone: {
        type: Number,
        required: true,
        unique: true
    },
    Email: {
        type: String,
        unique: true
    },
    Parentphone: {
        type: Number,
    },
    Password: {
        type: String,
        required: true
    },
    Institute: {
        type: String,
        required: true
    },
    City: {
        type: String,
        required: true
    },
    State: {
        type: String,
        required: true
    },
    Language: {
        type: String,
        required: true
    },
    level: {
        type: Number,
        default: 1

    },
    Coins: {
        type: Number,
        default: 100
    },
    referralcode: {
        type: String,
        unique: true
    },
    bonusdate: {
        type: Date,
    },
    Streaks: [
        {
            startDate: {
                type: Date,
            },
            endDate: {
                type: Date,
            }

        }
    ],
    Icy: {
        type: Date
    }

})

const Users = new mongoose.model("USER", userSchema);
module.exports = Users;