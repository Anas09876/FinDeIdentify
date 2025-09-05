# SecureDoc AI - Document De-identification System

## Overview

SecureDoc AI is a full-stack document processing application that automatically detects and redacts sensitive information from uploaded documents. The system performs OCR (Optical Character Recognition) on uploaded files, identifies personally identifiable information (PII) such as Aadhaar numbers, PAN numbers, and phone numbers, and generates redacted versions of the documents. Built with a React frontend and Express backend, it provides a comprehensive solution for document privacy protection.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Single-page application built with React and TypeScript using Vite as the build tool
- **UI Framework**: Implements shadcn/ui component library with Radix UI primitives for consistent, accessible interface components
- **Styling**: Uses Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: Leverages TanStack Query (React Query) for server state management and caching
- **Routing**: Utilizes Wouter for lightweight client-side routing
- **File Upload**: Supports drag-and-drop file uploads with validation for PDF, JPG, and PNG files up to 10MB

### Backend Architecture
- **Express Server**: RESTful API server with TypeScript support
- **File Processing Pipeline**: Multi-stage document processing including upload, OCR, sensitive data detection, and redaction
- **OCR Service**: Integrates Tesseract.js for text extraction from images and documents
- **Pattern Detection**: Uses regex patterns to identify Indian government IDs (Aadhaar, PAN) and phone numbers
- **Storage Layer**: Implements in-memory storage with interface for future database integration
- **Error Handling**: Comprehensive error handling with proper HTTP status codes and logging

### Data Storage Solutions
- **Current**: In-memory storage using Map-based implementation for documents and metadata
- **Configured**: PostgreSQL with Drizzle ORM for production deployment
- **Schema**: Defines document table with processing status tracking, file paths, and detected sensitive data as JSONB
- **File System**: Stores original and redacted files on local filesystem with configurable paths

### Authentication and Authorization
- **Session Management**: Uses express-session with PostgreSQL session store (connect-pg-simple)
- **CORS**: Configured for cross-origin requests with credentials support
- **File Access**: Protected file serving endpoints with validation

### Processing Pipeline
- **Stage Tracking**: Multi-stage processing with real-time status updates (upload → OCR → detection → redaction → complete)
- **Background Processing**: Asynchronous document processing to prevent blocking user interface
- **Progress Monitoring**: Real-time polling system for processing status updates
- **Error Recovery**: Graceful error handling with rollback capabilities

## External Dependencies

### Core Framework Dependencies
- **Frontend**: React, TypeScript, Vite for modern development experience
- **Backend**: Express.js with TypeScript for type-safe server development
- **Build Tools**: ESBuild for production bundling, TSX for development server

### UI and Styling
- **Component Library**: Radix UI primitives for accessibility-compliant components
- **Styling**: Tailwind CSS with PostCSS for utility-first styling
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts integration (Inter, DM Sans, Fira Code, Geist Mono)

### Data Management
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with Drizzle Kit for schema management and migrations
- **Validation**: Zod for runtime type validation and schema definition
- **Session Store**: connect-pg-simple for PostgreSQL-backed session storage

### File Processing
- **OCR Engine**: Tesseract.js for client-side and server-side text recognition
- **File Upload**: Multer for handling multipart form data and file uploads
- **File Validation**: Built-in MIME type and file size validation

### Development Tools
- **Development Environment**: Replit-specific plugins for enhanced development experience
- **Error Handling**: Runtime error overlay for development debugging
- **Code Generation**: Cartographer plugin for Replit integration

### Utility Libraries
- **Date Handling**: date-fns for date manipulation and formatting
- **Class Management**: clsx and class-variance-authority for conditional CSS classes
- **Form Handling**: React Hook Form with Hookform resolvers for form validation
- **Command Palette**: cmdk for search and command functionality