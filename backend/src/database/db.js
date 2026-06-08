import mongoose from "mongoose";


const connectDB = async (req, res) => {
    try {

        await mongoose.connect(`${process.env.MONGO_URI}note-app`);
        console.log(`mongodb connected successfully`);
    } catch (err) {
        console.log(err);

    }

}


export default connectDB;