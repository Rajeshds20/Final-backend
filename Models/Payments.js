const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
}, { timestamps: true });

const Payment = new mongoose.model("Payment", PaymentSchema);

module.exports = Payment;