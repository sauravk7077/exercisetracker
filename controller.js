const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const process = require('process');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    }
})

const User = mongoose.model("User", UserSchema);


