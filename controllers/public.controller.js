import User from "../models/user.model.js";
import {
  errorResponse,
  sucessResponse,
  HTTP_STATUS,
} from "../utils/response.js";
import jwt from "jsonwebtoken";
import { generateAccessAndRefreshTokens, setCookies } from "../utils/auth.js";

/* ======================================================
   Register
====================================================== */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, HTTP_STATUS.CONFLICT, "Email already registered");
    }

    const user = await User.create({ name, email, password, role, phone });

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    setCookies(res, accessToken, refreshToken);

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return sucessResponse(res, HTTP_STATUS.CREATED, "User created successfully", {
      user: createdUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
  }
};

/* ======================================================
   Login
====================================================== */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Email not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    setCookies(res, accessToken, refreshToken);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return sucessResponse(res, HTTP_STATUS.OK, "Logged in successfully", {
      user: loggedInUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
  }
};

/* ======================================================
   Logout
====================================================== */
export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return sucessResponse(res, HTTP_STATUS.OK, "Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
  }
};

/* ======================================================
   Refresh Access Token
====================================================== */
export const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken = req?.cookies?.refreshToken || req?.body?.refreshToken;

  if (!incomingRefreshToken) {
    return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Refresh token is expired or used");
    }

    const accessToken = user.generateAccessToken();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return sucessResponse(res, HTTP_STATUS.OK, "Access token refreshed", {
      accessToken,
    });
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Invalid or expired refresh token");
  }
};
