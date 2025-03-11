import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true},
  email:{type: String,required:true},
  password: { type: String, required: true },
  image:{type: String,default: "/public/images/user.png",},
  failedLoginAttempts: {type: Number,default: 0},
  lockUntil: {type: Number, default: null }

},{timestamps: true});

const User = mongoose.model('User', userSchema);

export default User;