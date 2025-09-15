import { SensitiveDataDetection } from "@shared/schema";
import fs from 'fs/promises';
import fsSynq from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import sharp from 'sharp';

export class RedactionService {
  
  async detectSensitiveData(text: string, filePath: string): Promise<SensitiveDataDetection> {
    const detectedData: SensitiveDataDetection = {
      aadhaarNumbers: [],
      panNumbers: [],
      phoneNumbers: [],
      blurredRegions: [],
    };

    // Aadhaar number pattern: 12 digits with optional spaces/hyphens
    const aadhaarPattern = /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g;
    let match;
    while ((match = aadhaarPattern.exec(text)) !== null) {
      const original = match[1];
      const redacted = this.maskAadhaar(original);
      detectedData.aadhaarNumbers.push({ original, redacted });
    }

    // PAN number pattern: 5 letters, 4 digits, 1 letter
    const panPattern = /\b([A-Z]{5}\d{4}[A-Z])\b/g;
    while ((match = panPattern.exec(text)) !== null) {
      const original = match[1];
      const redacted = this.maskPAN(original);
      detectedData.panNumbers.push({ original, redacted });
    }

    // Phone number pattern: Indian phone numbers
    const phonePattern = /\b(\+?91[\s-]?)?([\s-]?\d{5}[\s-]?\d{5}|\d{10})\b/g;
    while ((match = phonePattern.exec(text)) !== null) {
      const original = match[0];
      const redacted = this.maskPhone(original);
      detectedData.phoneNumbers.push({ original, redacted });
    }

    // For image detection (photos, signatures, QR codes), we'd need computer vision
    // For this demo, we'll simulate some detected regions
    if (detectedData.aadhaarNumbers.length > 0 || detectedData.panNumbers.length > 0) {
      detectedData.blurredRegions.push({
        type: 'photo',
        position: { x: 50, y: 50, width: 120, height: 150 }
      });
    }

    return detectedData;
  }

  async createRedactedDocument(
    originalPath: string,
    fileType: string,
    sensitiveData: SensitiveDataDetection
  ): Promise<string> {
    const filename = path.basename(originalPath);
    const sanitizedFilename = this.sanitizeFilename(filename);
    const redactedPath = path.join('uploads', 'redacted', `redacted_${sanitizedFilename}`);
    
    // Ensure redacted directory exists
    await fs.mkdir(path.dirname(redactedPath), { recursive: true });
    
    if (fileType === 'application/pdf') {
      await this.redactPDF(originalPath, redactedPath, sensitiveData);
    } else {
      await this.redactImage(originalPath, redactedPath, sensitiveData);
    }
    
    return redactedPath;
  }

  private async redactPDF(
    originalPath: string,
    redactedPath: string,
    sensitiveData: SensitiveDataDetection
  ): Promise<void> {
    try {
      // Read the original PDF
      const originalPdfBytes = await fs.readFile(originalPath);
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      
      // Get all pages
      const pages = pdfDoc.getPages();
      
      // For each page, add black rectangles over sensitive text areas
      for (const page of pages) {
        const { width, height } = page.getSize();
        
        // Draw redaction rectangles for each type of sensitive data
        // This is a simplified approach - in practice you'd need text positioning
        let yOffset = height - 100;
        
        // Redact areas containing sensitive data
        if (sensitiveData.aadhaarNumbers.length > 0) {
          page.drawRectangle({
            x: 50,
            y: yOffset,
            width: 200,
            height: 15,
            color: rgb(0, 0, 0), // Black rectangle
          });
          yOffset -= 25;
        }
        
        if (sensitiveData.panNumbers.length > 0) {
          page.drawRectangle({
            x: 50,
            y: yOffset,
            width: 150,
            height: 15,
            color: rgb(0, 0, 0),
          });
          yOffset -= 25;
        }
        
        if (sensitiveData.phoneNumbers.length > 0) {
          for (let i = 0; i < Math.min(sensitiveData.phoneNumbers.length, 3); i++) {
            page.drawRectangle({
              x: 50,
              y: yOffset,
              width: 120,
              height: 15,
              color: rgb(0, 0, 0),
            });
            yOffset -= 20;
          }
        }
        
        // Add redaction watermark
        page.drawText('REDACTED DOCUMENT', {
          x: 50,
          y: height - 50,
          size: 12,
          color: rgb(0.8, 0.1, 0.1),
        });
      }
      
      // Save the redacted PDF
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(redactedPath, pdfBytes);
      
    } catch (error) {
      console.error('PDF redaction error:', error);
      throw new Error('Failed to redact PDF document');
    }
  }

  private maskAadhaar(aadhaar: string): string {
    // Show only last 4 digits
    const cleaned = aadhaar.replace(/[\s-]/g, '');
    const lastFour = cleaned.slice(-4);
    return `XXXX XXXX ${lastFour}`;
  }

  private maskPAN(pan: string): string {
    // Show only last 4 characters
    const lastFour = pan.slice(-4);
    return `XXXXX${lastFour}`;
  }

  private maskPhone(phone: string): string {
    // Show only last 4 digits
    const cleaned = phone.replace(/[\s\-+]/g, '');
    const lastFour = cleaned.slice(-4);
    const prefix = phone.includes('+91') ? '+91 ' : '';
    return `${prefix}XXXXX ${lastFour}`;
  }

  private async redactImage(
    originalPath: string,
    redactedPath: string,
    sensitiveData: SensitiveDataDetection
  ): Promise<void> {
    try {
      // Read the original image
      const image = sharp(originalPath);
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Could not determine image dimensions');
      }
      
      // Create overlay rectangles for sensitive regions
      const overlays: any[] = [];
      
      // Add black rectangles over detected sensitive regions
      for (const region of sensitiveData.blurredRegions) {
        const { x, y, width, height } = region.position;
        
        // Create a black rectangle overlay
        const blackRect = Buffer.from(
          `<svg width="${width}" height="${height}">
            <rect width="${width}" height="${height}" fill="black"/>
            <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="white" font-size="10">[REDACTED]</text>
          </svg>`
        );
        
        overlays.push({
          input: blackRect,
          top: Math.max(0, Math.min(y, metadata.height - height)),
          left: Math.max(0, Math.min(x, metadata.width - width))
        });
      }
      
      // Apply overlays to the image
      let processedImage = image;
      
      if (overlays.length > 0) {
        processedImage = image.composite(overlays);
      }
      
      // Add redaction watermark
      const watermark = Buffer.from(
        `<svg width="200" height="30">
          <text x="10" y="20" fill="red" font-size="14" font-weight="bold">REDACTED DOCUMENT</text>
        </svg>`
      );
      
      // Apply watermark and save
      await processedImage
        .composite([{
          input: watermark,
          top: 10,
          left: 10
        }])
        .toFile(redactedPath);
        
    } catch (error) {
      console.error('Image redaction error:', error);
      throw new Error('Failed to redact image document');
    }
  }

  private sanitizeFilename(filename: string): string {
    // Remove path traversal attempts and dangerous characters
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.\./g, '_')
      .replace(/^[._-]+/, '')
      .substring(0, 100); // Limit length
  }
}
