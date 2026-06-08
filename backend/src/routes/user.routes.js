import express from 'express'
import { changePassword, forgotPassword, loginUser, logoutUser, registerUser, Verification, verifyOtp } from '../controllers/user.controller.js';
import { isAuthenticated } from '../middlewares/authenticated.middleware.js';
import { userSchema, validateUser } from '../validators/userValidate.js';
const router = express.Router();


router.post('/register', validateUser(userSchema), registerUser);
router.post('/verify', Verification);
router.post('/login', loginUser);
router.post('/logout', isAuthenticated, logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp/:email', verifyOtp);
router.patch('/change-password/:email', changePassword);


export default router;