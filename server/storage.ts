import { type Document, type InsertDocument, type SensitiveDataDetection, type ProcessingStatus } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createDocument(doc: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  updateProcessingStatus(id: string, status: ProcessingStatus): Promise<void>;
  updateDetectedData(id: string, data: SensitiveDataDetection): Promise<void>;
}

export class MemStorage implements IStorage {
  private documents: Map<string, Document>;

  constructor() {
    this.documents = new Map();
  }

  async createDocument(insertDoc: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const now = new Date();
    const doc: Document = {
      ...insertDoc,
      id,
      createdAt: now,
      updatedAt: now,
      redactedPath: insertDoc.redactedPath || null,
      processingStatus: insertDoc.processingStatus || 'pending',
      detectedSensitiveData: insertDoc.detectedSensitiveData || null,
    };
    this.documents.set(id, doc);
    return doc;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const doc = this.documents.get(id);
    if (!doc) return undefined;

    const updatedDoc: Document = {
      ...doc,
      ...updates,
      updatedAt: new Date(),
    };
    this.documents.set(id, updatedDoc);
    return updatedDoc;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  async updateProcessingStatus(id: string, status: ProcessingStatus): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) {
      await this.updateDocument(id, { processingStatus: status.stage });
    }
  }

  async updateDetectedData(id: string, data: SensitiveDataDetection): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) {
      await this.updateDocument(id, { detectedSensitiveData: data });
    }
  }
}

export const storage = new MemStorage();
