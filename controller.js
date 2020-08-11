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
    },
    data:[{
        description: String,
        duration: Number,
        date: Date
    }]
})

const User = mongoose.model("User", UserSchema);

async function getUser(filter) {
    return await User.findOne(filter).select('+username -__v -data');
}
async function getUserAndUpdate(id, update) {
    return await User.findOneAndUpdate({_id: id}, update, {useFindAndModify: true});
}
async function userExists(username){
    const user = await getUser({username: username});
    if(user) return true;
    else return false;
}

async function createNewUser(username) {
    const user = new User({
        username: username
    });
    let cUser = await user.save();
    return {_id:cUser.id, username: cUser.username};
}

async function addNewUser(req, res){
    try{
        const user = req.body.username;
        let userExist = await userExists(user);
        if(userExist){
            res.json(await getUser({username: user}));
        }
        res.json(await createNewUser(user));
    }catch(e){
        console.log(e);
        res.json({a:e})
    }
    
}

async function handleAddExercise(req, res){
    const {userId, description, duration, date} = req.body;
    let update = {$push: {data: [{
        description: description,
        duration: duration,
        date: date?new Date(date): new Date()
    }]}};
    if(await userExists({_id: userId})){
        res.json(await getUserAndUpdate(userId, update));
    }
    res.json({error: "User not found"})
    
}






module.exports = {
    addNewUser,
    handleAddExercise
}
