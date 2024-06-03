const express = require('express');
const User = require('../Model/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res, next) => {
    try {
        const { name, password, email, confirmpassword } = req.body;
        if (!name || !password || !email || !confirmpassword) {
            return res.json({
                message: "Fill all the fields"
            })
        }

        if (password !== confirmpassword) {
            return res.json({
                message: "Passwords do not match"
            });
        }

        const emailRegex = /\b[A-Za-z0-9._%+-]+@gmail\.com\b/;
        if (!emailRegex.test(email)) {
            return res.json({
                message: "Invalid email format. Only @gmail.com emails are allowed."
            });
        }

        const isExistingUser = await User.findOne({ email: email })
        if (isExistingUser) {
            return res
                .json({ message: "user already exists, try another Email" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const userData = new User({
            name,
            email,
            password: hashedPassword,
            confirmpassword: hashedPassword
        })

        await userData.save();
        res.json({ message: "user registered successfully" })

    } catch (error) {
        next(error)
    }
}

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({
                message: "Fill all the fields"
            })
        }
        const userDetails = await User.findOne({ email });

        if (!userDetails) {
            return res
                .json({
                    message: "Invalid Credentials"
                })
        }

        const passwordMatch = await bcrypt.compare(password, userDetails.password)

        if (!passwordMatch) {
            return res
                .json({
                    message: "Invalid Password"
                })
        }

        const token = jwt.sign({ userId: userDetails._id }, 'vinodh');

        res.json({ message: "User logged in", name: userDetails.name, token: token, email: userDetails.email })

    }
    catch (error) {
        next(error)
    }
}


module.exports = { registerUser, loginUser };