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

async function getUser(filter, select="+username -__v -data", limit) {
    let query = User.findOne(filter).select(select);
    if(limit)
        query.limit(limit).lean()
    return await query.exec();
}
async function getUserAndUpdate(id, update) {
    return await User.findOneAndUpdate({_id: id}, update);
}
async function userExists(filter){
    const user = await getUser(filter);
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
        let userExist = await userExists({username:user});
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
        data = await getUserAndUpdate(userId, update);
        res.json({
            username: data.username, 
            _id: userId,
            description: description,
            duration: duration,
            date:  date?new Date(date): new Date()
        });
    }
    else
        res.json({error: "User not found"});
}

async function handleGetUsers(req, res){
    try{
        let users = await User.find().select('+username +data -__v');
        res.json({users});
    }catch(e) {
        res.send("Error occured");
    }
}

function isValidDate(dateString){
    return !isNaN(Date.parse(dateString));
}

async function handleGetLog(req, res){
    let {userId, from, to, limit} = req.query;
    from = isValidDate(from)?from: undefined;
    to = isValidDate(to)?to: undefined;
    limit = Number(limit);
    try{

            if(await userExists({_id: userId}))
            {
                let query = {_id: userId, "data.date":
                        {
                            ...(from && {"$gte": new Date(from)}),
                            ...(to && {"$lte": new Date(to)})
                        }
                };
                if(Object.keys(query['data.date']).length == 0)
                    delete query['data.date'];
                let q = User.find(query, {'data': {$slice: limit}});
                let json = await q.select('+username -__v -data._id -data.__v').lean().exec();
                console.log(json);
                json = json[0];
                if(json){
                    
                    json.count = json.data.length;
                    res.json(json);
                }
                else
                    res.json({});
            }else
                res.json({'error': 'Incorrect userId'});
    }catch(e){
        console.log(e);
        res.json({error: "error"})
    }
    
}




module.exports = {
    addNewUser,
    handleAddExercise,
    handleGetUsers,
    handleGetLog
}
