import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ConnectDB } from "./config/config.js";
import apiRoutes from "./routes/index.js";

ConnectDB();

const app = express();

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Serve public folder (uploaded files)
const __dirname = path.resolve();
app.use("/public", express.static(path.join(__dirname, "public")));

// CORS
app.use(
  cors({
    origin: (origin, cb) =>
      !origin || ["http://localhost:5173", "http://localhost:3000"].includes(origin)
        ? cb(null, true)
        : cb(new Error("Not allowed")),
    credentials: true,
  })
);

// Routes
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.send("Rental Listings & Move-in Platform API is running!");
});

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
