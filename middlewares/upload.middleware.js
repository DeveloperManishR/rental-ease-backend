import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Decide upload folder based on mimetype
 */
const getUploadFolder = (mimetype) => {
  if (mimetype.startsWith("image/")) return "images";
  if (mimetype.startsWith("video/")) return "videos";
  if (mimetype === "application/pdf") return "pdfs";

  // Word documents ONLY
  if (
    mimetype === "application/msword" ||
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docs";
  }

  return null;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = getUploadFolder(file.mimetype);

    if (!folder) {
      return cb(new Error("Unsupported file type"));
    }

    const uploadPath = path.join("public", folder);

    // Ensure directory exists
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

/**
 * Strict file filter
 * ONLY: images, videos, pdf, doc, docx
 */
const fileFilter = (req, file, cb) => {
  const { mimetype } = file;

  const isAllowed =
    mimetype.startsWith("image/") ||
    mimetype.startsWith("video/") ||
    mimetype === "application/pdf" ||
    mimetype === "application/msword" ||
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error("Only images, videos, PDFs, and Word documents are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/* ──────────────────────────────────────────────────────
   Property Image Upload — memory storage + Cloudinary
   Images only, max 4 files, 5MB each
   ────────────────────────────────────────────────────── */

const imageOnlyFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, WebP, etc.) are allowed"), false);
  }
};

export const uploadPropertyImages = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageOnlyFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 5MB per file
    files: 4,                   // max 4 images
  },
});

/* ──────────────────────────────────────────────────────
   Move-In Document Upload — memory storage + Cloudinary
   Supports images, PDFs, and Word docs, max 10 files, 10MB each
   ────────────────────────────────────────────────────── */

export const uploadMoveInDocuments = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10,                   // max 10 documents
  },
});
