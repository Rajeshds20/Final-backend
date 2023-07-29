const mongoose = require('mongoose');

const PointshistorySchema = new mongoose.Schema({

    userid: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
    },
    History: [{
        Task: {
            type: String,
        },
        Date: {
            type: Date,
            required: true,
        },
        Duration: {
            type: Number,
        },
        Activity: {
            type: String,
            required: true
        },
        Points: {
            type: Number,
            required:true
        },
    }]

})

const Points = new mongoose.model("Points", PointshistorySchema);
module.exports = Points;