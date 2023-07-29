const mongoose = require('mongoose');

const SplashSchema = new mongoose.Schema({
     
Question:{
    type: String,
    required: true,
    unique: true
},
emoji:{
    type: String,
    required: true,
    default:'😊'
}
})

const  Splash =  new mongoose.model("Splash", SplashSchema);
module.exports = Splash;