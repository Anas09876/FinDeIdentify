import Tesseract from 'tesseract.js';
import fs from 'fs/promises';
import path from 'path';
import { createWorker } from 'tesseract.js';

export class OCRService {
  private worker: Tesseract.Worker | null = null;

  async initialize() {
    if (!this.worker) {
      this.worker = await createWorker('eng');
    }
  }

  async extractText(filePath: string, fileType: string): Promise<string> {
    await this.initialize();
    
    try {
      if (fileType === 'application/pdf') {
        return await this.extractTextFromPDF(filePath);
      }

      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      const { data: { text } } = await this.worker.recognize(filePath);
      return text;
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  private async extractTextFromPDF(filePath: string): Promise<string> {
    // For this hackathon demo, we'll simulate PDF text extraction
    // In a real implementation, you'd use libraries like pdf2pic + poppler-utils
    console.log('Processing PDF:', filePath);
    
    // Return sample text that contains Indian ID formats for demo
    return `Sample Document - Identity Verification
    
    Personal Information:
    Name: RAJESH KUMAR SHARMA
    Father's Name: SURESH KUMAR SHARMA
    Date of Birth: 15/03/1985
    Gender: Male
    
    Government IDs:
    Aadhaar Number: 1234 5678 9012
    PAN Number: ABCDE1234F
    
    Contact Information:
    Phone: +91 9876543210
    Mobile: 8765432109
    Address: 123 Main Street, New Delhi 110001
    
    Additional Details:
    Email: rajesh.sharma@email.com
    Alternative Phone: +91-9988776655
    Emergency Contact: 9123456789`;
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
