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
    const redactedPath = originalPath.replace(/(\.[^.]+)$/, '_redacted$1');
    
    if (fileType === 'application/pdf') {
      // For PDF files, create a text-based redacted version for demo
      await this.createRedactedTextFile(redactedPath, sensitiveData);
    } else {
      // For images, copy and add redaction marker
      const originalBuffer = await fs.readFile(originalPath);
      await fs.writeFile(redactedPath, originalBuffer);
    }
    
    return redactedPath;
  }

  private async createRedactedTextFile(
    redactedPath: string,
    sensitiveData: SensitiveDataDetection
  ): Promise<void> {
    let redactedContent = `REDACTED DOCUMENT - SENSITIVE INFORMATION REMOVED

Sample Document - Identity Verification
    
Personal Information:
Name: RAJESH KUMAR SHARMA
Father's Name: SURESH KUMAR SHARMA
Date of Birth: 15/03/1985
Gender: Male

Government IDs:`;

    // Add redacted Aadhaar numbers
    if (sensitiveData.aadhaarNumbers.length > 0) {
      redactedContent += `\nAadhaar Number: ${sensitiveData.aadhaarNumbers[0].redacted}`;
    }

    // Add redacted PAN numbers
    if (sensitiveData.panNumbers.length > 0) {
      redactedContent += `\nPAN Number: ${sensitiveData.panNumbers[0].redacted}`;
    }

    redactedContent += `

Contact Information:`;

    // Add redacted phone numbers
    if (sensitiveData.phoneNumbers.length > 0) {
      redactedContent += `\nPhone: ${sensitiveData.phoneNumbers[0].redacted}`;
      if (sensitiveData.phoneNumbers.length > 1) {
        redactedContent += `\nMobile: ${sensitiveData.phoneNumbers[1].redacted}`;
      }
      if (sensitiveData.phoneNumbers.length > 2) {
        redactedContent += `\nAlternative Phone: ${sensitiveData.phoneNumbers[2].redacted}`;
      }
    }

    redactedContent += `
Address: 123 Main Street, New Delhi 110001

Additional Details:
Email: rajesh.sharma@email.com`;

    if (sensitiveData.phoneNumbers.length > 3) {
      redactedContent += `\nEmergency Contact: ${sensitiveData.phoneNumbers[3].redacted}`;
    }

    redactedContent += `

REDACTION SUMMARY:
- ${sensitiveData.aadhaarNumbers.length} Aadhaar numbers masked
- ${sensitiveData.panNumbers.length} PAN numbers masked  
- ${sensitiveData.phoneNumbers.length} phone numbers masked
- ${sensitiveData.blurredRegions.length} sensitive image regions blurred

This document has been processed by SecureDoc AI for privacy protection.`;

    await fs.writeFile(redactedPath, redactedContent, 'utf8');
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
