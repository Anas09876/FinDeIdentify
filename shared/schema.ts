import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalPath: text("original_path").notNull(),
  redactedPath: text("redacted_path"),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  processingStatus: text("processing_status").notNull().default("pending"),
  detectedSensitiveData: jsonb("detected_sensitive_data"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export interface SensitiveDataDetection {
  aadhaarNumbers: Array<{ original: string; redacted: string; position?: { x: number; y: number; width: number; height: number } }>;
  panNumbers: Array<{ original: string; redacted: string; position?: { x: number; y: number; width: number; height: number } }>;
  phoneNumbers: Array<{ original: string; redacted: string; position?: { x: number; y: number; width: number; height: number } }>;
  blurredRegions: Array<{ type: 'photo' | 'signature' | 'qr_code'; position: { x: number; y: number; width: number; height: number } }>;
}

export interface ProcessingStatus {
  stage: 'upload' | 'ocr' | 'detection' | 'redaction' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}
