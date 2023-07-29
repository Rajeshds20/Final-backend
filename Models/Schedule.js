const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
user:{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref : "USERS" 
},
title: {
    type: String,
    required: true
},
description : {
    type: String,
    required: true
},
date : {
    type: mongoose.Schema.Types.Date,
    required: true
},
priority : {
    type: String,
    required: true
},
time : {
    type: String,
    required: true
},
revision :{
    type:String
},
difficulty :{
    type:String
},
progress :{
    type:String
}



})

const Schedule =  new mongoose.model("Schedule", ScheduleSchema);
module.exports = Schedule; 