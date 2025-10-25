import express from 'express'
import { createNewUser, handleUserLogin } from '../controllers/authController.js'

const router = express.Router()

router.route("/register")
    .post(createNewUser)
router.route("/login")
    .post(handleUserLogin)
export default router