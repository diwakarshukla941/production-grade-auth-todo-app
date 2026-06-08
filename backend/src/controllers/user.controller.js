
import jwt, { decode } from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { verifyEmail } from '../emailVerify/verifyEmail.js';
import 'dotenv/config'
import bcrypt from 'bcryptjs';
import { Session } from '../models/session.model.js';
import { sendOtpMail } from '../emailVerify/sendOtpMail.js';
export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: `All fields are required!`
            })
        }

        const existingUser = await User.findOne({ email })
        
        // Case 1: User exists and is verified
        if (existingUser && existingUser.isVerified) {
            return res.status(409).json({
                success: false,
                message: 'Account already exists. Please login.'
            })
        }

        // Case 2: User exists but is NOT verified
        if (existingUser && !existingUser.isVerified) {
            // Generate new verification token
            const newToken = await jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: "10m" })
            
            // Update token
            existingUser.token = newToken;
            await existingUser.save();
            
            // Resend verification email
            verifyEmail(newToken, email)
            
            return res.status(200).json({
                success: true,
                message: 'Your account is not verified. A new verification email has been sent.',
                data: existingUser
            })
        }

        // Case 3: User doesn't exist - create new user
        const newUser = await User.create({
            username,
            email,
            password
        })
        const token = await jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: "10m" })
        verifyEmail(token, email)
        newUser.token = token;
        await newUser.save();

        return res.status(201).json({
            success: true,
            message: 'User registered successfully! A verification email has been sent.',
            data: newUser
        })


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

export const Verification = async (req, res) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is missing or invalid"
            })
        }

        const token = authHeader.split(' ')[1]
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(400).json({
                    success: false,
                    message: "Authorization token is expired"
                })
            }
            return res.status(400).json({
                success: false,
                message: "Authorization token Verification Failed"
            })
        }
        const user = await User.findById(decoded.id)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            })
        }
        user.token = null;
        user.isVerified = true;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Email verified successfully!"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error" + error.message
        })
    }
}


export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password is required!"
            })
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No user found!"
            })
        }

        const verifyPassword = await bcrypt.compare(password, user.password)
        if (!verifyPassword) {
            return res.status(400).json({
                success: false,
                message: "Incorrect Password!"
            })
        }

        // check if user verified!
        if (user.isVerified === false) {
            return res.status(403).json({
                success: false,
                message: "Not verified!, Verify your account"
            })
        }
        // check for exisiting session and delete it
        const existingSession = await Session.findOne({ userId: user._id });
        if (existingSession) {
            await existingSession.deleteOne({ userId: user._id });
        }
        // create a new session
        await Session.create({
            userId: user._id
        })


        // generate Tokens

        const accessToken = await jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "10d" })
        const refreshToken = await jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "30d" })

        user.isLoggedIn = true
        await user.save()

        return res.status(200).json({
            success: true,
            message: `Welcome back ${user.username}`,
            accessToken,
            refreshToken,
            user
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



export const logoutUser = async (req, res) => {
    try {

        const userId = req.userId;
        await Session.deleteMany({ userId })
        await User.findByIdAndUpdate(userId, { isLoggedIn: false })
        return res.status(200).json({
            success: true,
            message: "Logged out successfully! "
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No user found!"
            })
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
        await sendOtpMail(email, otp);
        return res.status(200).json({
            success: true,
            message: "Otp sent successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


export const verifyOtp = async (req, res) => {
    const { otp } = req.body;
    const email = req.params.email;
    if (!otp) {
        return res.status(400).json({
            success: false,
            message: "otp is required!"
        })
    }

    try {
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No user found!"
            })
        }

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "Otp not generated or already verified!"
            })
        }
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Otp has expired please request a new one"
            })
        }

        if (otp !== user.otp) {
            return res.status(404).json({
                success: false,
                message: "Invalid Otp!"
            })
        }
        user.otp = null;
        user.otpExpiry = null;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Otp verified successfully!"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const changePassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const { email } = req.params;
    if (!newPassword || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "newPassword and confirmPassword is required!"
        })
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "newPassword and confirmPassword do not match!"
        })
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No user found!"
            })
        }

        user.password = newPassword;
        await user.save();
        return res.status(201).json({
            success: true,
            message: "Password changed successfully!"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}