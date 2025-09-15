import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText } from "lucide-react";

interface DocumentViewerProps {
  documentId: string;
  type: 'original' | 'redacted';
  className?: string;
}

export default function DocumentViewer({ documentId, type, className }: DocumentViewerProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Cleanup previous URL if it exists
    if (currentUrlRef.current) {
      window.URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }

    const loadDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setDocumentUrl(null);
        setDocumentType(null);
        
        const response = await fetch(`/api/documents/${documentId}/file/${type}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load ${type} document`);
        }
        
        const contentType = response.headers.get('Content-Type');
        setDocumentType(contentType);
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Store in ref for cleanup and state for rendering
        currentUrlRef.current = url;
        setDocumentUrl(url);
      } catch (err) {
        console.error('Document loading error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();

    // Cleanup function
    return () => {
      if (currentUrlRef.current) {
        window.URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, [documentId, type]); // Removed documentUrl from dependencies to prevent infinite loop

  if (isLoading) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-32 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <p className="font-medium text-foreground">Failed to load document</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderDocument = () => {
    if (!documentUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No preview available</p>
          </div>
        </div>
      );
    }

    // Handle PDF files
    if (documentType?.includes('pdf')) {
      return (
        <div className="h-full">
          <iframe
            src={documentUrl}
            className="w-full h-full border-0"
            title={`${type} document`}
            data-testid={`document-preview-${type}`}
          />
          <div className="absolute top-2 right-2 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs font-medium text-blue-800 dark:text-blue-200 flex items-center">
            <FileText className="h-3 w-3 mr-1" />
            PDF
          </div>
        </div>
      );
    }

    // Handle image files
    return (
      <img
        src={documentUrl}
        alt={`${type} document`}
        className="w-full h-full object-contain"
        data-testid={`document-preview-${type}`}
      />
    );
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden relative ${className}`}>
      {renderDocument()}
    </div>
  );
}
