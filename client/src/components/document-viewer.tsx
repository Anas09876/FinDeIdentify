import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface DocumentViewerProps {
  documentId: string;
  type: 'original' | 'redacted';
  className?: string;
}

export default function DocumentViewer({ documentId, type, className }: DocumentViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/documents/${documentId}/file/${type}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load ${type} document`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        console.error('Document loading error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();

    return () => {
      if (imageUrl) {
        window.URL.revokeObjectURL(imageUrl);
      }
    };
  }, [documentId, type]);

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

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${type} document`}
          className="w-full h-full object-contain"
          data-testid={`document-preview-${type}`}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No preview available</p>
          </div>
        </div>
      )}
    </div>
  );
}
