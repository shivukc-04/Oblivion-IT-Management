import express from 'express';
import { createNewUser, handleUserLogin, handleForgotPassword } from '../controllers/authController.js';

const router = express.Router();

router.route('/register')
    .post(createNewUser);
router.route('/login')
    .post(handleUserLogin);
router.route('/forgot-password')
    .post(handleForgotPassword);
export default router;
