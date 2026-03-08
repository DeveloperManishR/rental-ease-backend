import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import {
  sucessResponse,
  errorResponse,
  HTTP_STATUS,
} from "../utils/response.js";

/* ======================================================
   Get Profile
====================================================== */
export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, "User not found");
    }

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return sucessResponse(res, HTTP_STATUS.OK, "Profile retrieved successfully", userData);
  } catch (error) {
    console.error("Profile error:", error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
  }
};

/* ======================================================
   Update Profile
====================================================== */
export const updateProfile = async (req, res) => {
  const userId = req.user._id;
  try {
    const { name, phone, password } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password -__v -refreshToken");

    return sucessResponse(res, HTTP_STATUS.OK, "Profile updated successfully", updatedUser);
  } catch (error) {
    console.error("Update Profile Error:", error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
  }
};

/* ======================================================
   Reset Password
====================================================== */
export const resetPassword = async (req, res) => {
  const userId = req.user._id;
  try {
    const { password } = req.body;

    if (!password) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Password is required");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });

    return sucessResponse(res, HTTP_STATUS.OK, "Password changed successfully");
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
  }
};
