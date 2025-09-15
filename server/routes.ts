import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, type SensitiveDataDetection, type ProcessingStatus } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { OCRService } from "./services/ocr-service";
import { RedactionService } from "./services/redaction-service";

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const ocrService = new OCRService();
  const redactionService = new RedactionService();

  // Upload document endpoint
  app.post("/api/documents/upload", upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const document = await storage.createDocument({
        filename: req.file.originalname,
        originalPath: req.file.path,
        redactedPath: null,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        processingStatus: "pending",
        detectedSensitiveData: null,
      });

      // Start background processing
      processDocumentAsync(document.id, ocrService, redactionService);

      res.json(document);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Get document status
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ message: "Failed to retrieve document" });
    }
  });

  // Get document file (original or redacted)
  app.get("/api/documents/:id/file/:type", async (req, res) => {
    try {
      const { id, type } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const filePath = type === 'redacted' ? document.redactedPath : document.originalPath;
      
      if (!filePath) {
        return res.status(404).json({ message: `${type} file not available` });
      }

      const fileBuffer = await fs.readFile(filePath);
      
      // Sanitize filename for security
      const sanitizedFilename = document.filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.\./g, '_')
        .replace(/^[._-]+/, '')
        .substring(0, 100);
      
      // Set proper headers for inline viewing in browser
      res.set({
        'Content-Type': document.fileType,
        'Content-Disposition': `inline; filename="${type}_${sanitizedFilename}"`,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      });
      
      res.send(fileBuffer);
    } catch (error) {
      console.error("File download error:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (document) {
        // Clean up files
        try {
          await fs.unlink(document.originalPath);
          if (document.redactedPath) {
            await fs.unlink(document.redactedPath);
          }
        } catch (fileError) {
          console.error("File cleanup error:", fileError);
        }
      }

      const deleted = await storage.deleteDocument(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json({ message: "Document deleted" });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background processing function
async function processDocumentAsync(
  documentId: string,
  ocrService: OCRService,
  redactionService: RedactionService
) {
  try {
    // Update status: OCR processing
    await storage.updateProcessingStatus(documentId, {
      stage: 'ocr',
      progress: 25,
      message: 'Extracting text from document...',
    });

    const document = await storage.getDocument(documentId);
    if (!document) return;

    // Perform OCR
    const extractedText = await ocrService.extractText(document.originalPath, document.fileType);

    // Update status: Detection
    await storage.updateProcessingStatus(documentId, {
      stage: 'detection',
      progress: 50,
      message: 'Detecting sensitive information...',
    });

    // Detect sensitive data
    const sensitiveData = await redactionService.detectSensitiveData(extractedText, document.originalPath);

    // Update status: Redaction
    await storage.updateProcessingStatus(documentId, {
      stage: 'redaction',
      progress: 75,
      message: 'Redacting sensitive information...',
    });

    // Create redacted document
    const redactedPath = await redactionService.createRedactedDocument(
      document.originalPath,
      document.fileType,
      sensitiveData
    );

    // Update document with results
    await storage.updateDocument(documentId, {
      redactedPath,
      processingStatus: 'complete',
      detectedSensitiveData: sensitiveData,
    });

    await storage.updateProcessingStatus(documentId, {
      stage: 'complete',
      progress: 100,
      message: 'Document processing complete',
    });

  } catch (error) {
    console.error("Processing error:", error);
    await storage.updateProcessingStatus(documentId, {
      stage: 'error',
      progress: 0,
      message: 'Processing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
