const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const db = mongoose.connect(process.env.MONGODB_URL).then(
    () => { console.log("database connected succesfully") }
).catch((err) => {
    console.log(err)
})

module.exports = db;