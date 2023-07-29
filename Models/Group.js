const mongoose = require('mongoose');

// Make the group self delete after 24h if its temporary

const GroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
    }],
    type: {
        type: String,
        enum: ['public', 'private'],
        default: 'public',
    },
    temporary: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isFirstSave: {
        type: Boolean,
        default: true,
    },
});

// GroupSchema.pre('save', function (next) {
//     if (this.temporary && this.isFirstSave) {
//         this.isFirstSave = false; // Set the flag to false after the first save
//         setTimeout(() => {
//             this.remove()
//                 .then(() => next())
//                 .catch(next);
//         }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
//     } else {
//         next();
//     }
// });

const Group = mongoose.model('Group', GroupSchema);

module.exports = Group;