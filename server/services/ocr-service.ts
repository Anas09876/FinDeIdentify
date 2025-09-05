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
        // For PDF files, we'll need to convert to images first
        // For now, we'll use a simplified approach and assume images
        throw new Error('PDF processing not implemented in this demo version');
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

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
