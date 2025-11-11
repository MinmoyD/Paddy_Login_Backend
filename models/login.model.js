import mongoose from "mongoose";

const { Schema } = mongoose;


const LoginSchema = new Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        min:6
    },
    isAdmin:{
        type:Boolean,
        default:false
    }
});


export default mongoose.model("Login",LoginSchema);
