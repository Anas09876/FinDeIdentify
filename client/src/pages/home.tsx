import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";
import UploadZone from "@/components/upload-zone";
import ProcessingSection from "@/components/processing-section";
import ResultsSection from "@/components/results-section";
import { type Document } from "@shared/schema";

export default function Home() {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentStage, setCurrentStage] = useState<'upload' | 'processing' | 'results'>('upload');

  const handleUploadComplete = (document: Document) => {
    setCurrentDocument(document);
    setCurrentStage('processing');
  };

  const handleProcessingComplete = (document: Document) => {
    setCurrentDocument(document);
    setCurrentStage('results');
  };

  const handleStartOver = () => {
    setCurrentDocument(null);
    setCurrentStage('upload');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SecureDoc AI</h1>
                <p className="text-xs text-muted-foreground">Document Deidentification Tool</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-green-500" />
                <span>Secure Processing</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStage === 'upload' && (
          <UploadZone onUploadComplete={handleUploadComplete} />
        )}
        
        {currentStage === 'processing' && currentDocument && (
          <ProcessingSection 
            document={currentDocument}
            onComplete={handleProcessingComplete}
          />
        )}
        
        {currentStage === 'results' && currentDocument && (
          <ResultsSection 
            document={currentDocument}
            onStartOver={handleStartOver}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <Shield className="h-3 w-3 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">SecureDoc AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Advanced AI-powered document deidentification for fintech compliance and privacy protection.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Security Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>End-to-end encryption</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>No data retention</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>GDPR compliant</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Supported Formats</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>PDF Documents</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>JPG, PNG Images</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Multi-language OCR</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 SecureDoc AI. Built for Hackathon Demo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
