const express = require('express');
const app = express();
const port = 3333;
const db = require('./Database/db');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

app.use(cors());
app.use(express.json())

const userRouter = require('./Routes/userRoute');
const quizRouter = require('./Routes/quizRoute')


app.use('/user', userRouter);
app.use('/quiz', quizRouter);

app.listen(port, () => {
    console.log("server started successfully")
})