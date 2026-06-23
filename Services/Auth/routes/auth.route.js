import { Router } from "express";

import { verifyToken, registerUser, loginUser } from "../controllers/User.js";

const router = Router();
router.route("/verify").get(verifyToken);
router.route("/signup").post(registerUser);
router.route("/login").post(loginUser);

export default router;
