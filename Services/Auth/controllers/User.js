import "dotenv/config";
import bcrypt from "bcrypt";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";

import { User } from "../models/User.js";

export const verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return (res.status(httpStatus.UNAUTHORIZED).json({ message: "Token Missing" }));
        }

        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET;
        jwt.verify(token, secret);
        return (res.status(httpStatus.OK).json({ message: "Token Verified" }));
    } catch (err) {
        return (res.status(httpStatus.UNAUTHORIZED).json({ message: "Token Invalid or Expired" }));
    }
};

export const registerUser = async (req, res) => {
    try {
        let { name, username, email, password } = req.body;
        if (!name || !username || !email || !password) {
            return (res.status(httpStatus.BAD_REQUEST).json({ message: "Missing Credentials" }));
        }

        let existingUser = await User.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        });
        if (existingUser) {
            return (res.status(httpStatus.CONFLICT).json({ message: "Username/Email Already Taken" }));
        }

        let hash = await bcrypt.hash(password, 10);
        let newUser = new User({
            name: name,
            username: username,
            email: email,
            password: hash
        });
        let result = await newUser.save();
        console.log(`Registered User : ${result}`);

        const secret = process.env.JWT_SECRET;
        let token = jwt.sign(
            { userId: newUser._id },
            secret,
            { expiresIn: "12h" }
        );
        res.status(httpStatus.CREATED).json({ message: "User Registered", token: token });
    } catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: err.message });
    }
};

export const loginUser = async (req, res) => {
    console.log("Login Request Received");
    try {
        let { username, password } = req.body;
        if (!username || !password) {
            return (res.status(httpStatus.BAD_REQUEST).json({ message: "Missing Credentials" }));
        }

        let user = await User.findOne({ username });
        if (!user) {
            return (res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" }));
        }

        let pass = await bcrypt.compare(password, user.password);
        if (pass) {
            const secret = process.env.JWT_SECRET;
            let token = jwt.sign(
                { userId: user._id },
                secret,
                { expiresIn: "12h" }
            );
            return (res.status(httpStatus.OK).json({ message: "Login Successful", token: token }));
        } else {
            return (res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Credentials" }));
        }
    } catch (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: err.message });
    }
};
