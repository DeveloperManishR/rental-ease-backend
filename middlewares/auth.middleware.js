import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { errorResponse, HTTP_STATUS } from "../utils/response.js";

/* ======================================================
   Extract Access Token (Cookies → Header)
====================================================== */
export const extractAccessToken = (req) => {
  // 1️⃣ Cookies first
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // 2️⃣ Authorization header fallback
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1].trim();
  }

  return null;
};

/* ======================================================
   Verify JWT Token
====================================================== */
const verifyJwtToken = (token) => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
};

/* ======================================================
   Unified Authenticate Middleware
====================================================== */
export const authenticate = async (req, res, next) => {
  try {
    const token = extractAccessToken(req);

    if (!token) {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "No access token provided"
      );
    }

    let decoded;
    try {
      decoded = verifyJwtToken(token);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return errorResponse(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          "Access token expired"
        );
      }
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "Invalid access token"
      );
    }

    const user = await User.findById(decoded._id).select("-password -__v");

    if (!user) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorized request");
  }
};

/* ======================================================
   Role-Based Authorization Middleware
====================================================== */
export const hasAccess = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "User not authenticated"
      );
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        "Access denied: Insufficient permissions"
      );
    }

    next();
  };
};



