import User from "../models/user.model.js";

export const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const accessToken = user.generateAccessToken(); // expires in 5m
    const refreshToken = user.generateRefreshToken(); // expires in 1h

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error);
    throw error; // IMPORTANT: do not swallow errors
  }
};

export const setCookies = (res, accessToken, refreshToken) => {
  // Access Token → 1 Day
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // XSS protection
    secure: true,
   // secure: process.env.NODE_ENV === "production",
    sameSite: "none", // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
  });

  // Refresh Token → 7 Days
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // XSS protection
    secure: true,
   // secure: process.env.NODE_ENV === "production",
    sameSite: "none", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};


