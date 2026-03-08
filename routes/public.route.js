import express from "express";
import {
  login,
  logout,
  register,
  refreshAccessToken,
} from "../controllers/public.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", authenticate, logout);
router.post("/refresh-token", refreshAccessToken);

export default router;
