import express from 'express';
import { createNewUser, createAdminCreatedUser, handleUserLogin, handleForgotPassword } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';

const router = express.Router();

router.route('/register')
    .post(createNewUser);
router.route('/admin/register')
    .post(verifyToken, authorizeRoles('admin'), createAdminCreatedUser);
router.route('/login')
    .post(handleUserLogin);
router.route('/forgot-password')
    .post(handleForgotPassword);
export default router;
