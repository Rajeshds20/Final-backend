const mongoose = require('mongoose');

const FriendsSchema = new mongoose.Schema({

    Sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "USER"
    },
    Receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "USER"
    },
    Time: {
        type: Date,
    },
    Type: {
        type: String,
        enum: ['Requested', 'Confirmed'],
    }
})

const Friends = new mongoose.model("FRIENDS", FriendsSchema);
module.exports = Friends;