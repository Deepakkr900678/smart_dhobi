const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

exports.connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Database connected successfully");

    } catch (err) {
        console.log("Error connecting to database", err);
        process.exit(1);
    }
}