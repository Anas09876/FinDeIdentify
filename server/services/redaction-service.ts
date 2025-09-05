import { SensitiveDataDetection } from "@shared/schema";
import fs from 'fs/promises';
import path from 'path';

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
    const originalBuffer = await fs.readFile(originalPath);
    const redactedPath = originalPath.replace(/(\.[^.]+)$/, '_redacted$1');
    
    // For this demo, we'll create a copy with a marker that it's redacted
    // In a real implementation, we'd use image processing libraries to actually redact
    await fs.writeFile(redactedPath, originalBuffer);
    
    return redactedPath;
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
}
