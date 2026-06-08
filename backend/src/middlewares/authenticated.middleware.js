import jwt from 'jsonwebtoken'
import { User } from '../models/user.model.js';
export const isAuthenticated = async (req, res, next) => {
    try {
        const authHeaders = req.headers.authorization   ;
        if (!authHeaders || !authHeaders.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access token Verification Failed"
            })
        }

        const token = authHeaders.split(" ")[1];
        await jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    return res.status(400).json({
                        success: false,
                        message: "Access token has expired, use refresh Token to generate again"
                    })
                }
                return res.status(400).json({
                    success: false,
                    message: "Access token is missing or invalid"
                })
            }
            const { id } = decoded;
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                })
            }
            req.userId = user._id
            next();
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}