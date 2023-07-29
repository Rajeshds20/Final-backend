const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const db = process.env.DB;

mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Database connected succesfully")
}).catch((e) => {
    console.log("Database not connected")
    console.log(e, '<=error')
})