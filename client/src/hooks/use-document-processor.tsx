import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Document } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useDocumentProcessor() {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      const response = await apiRequest('POST', '/api/documents/upload', formData);
      return response.json() as Promise<Document>;
    },
    onSuccess: (document) => {
      setCurrentDocument(document);
      toast({
        title: "Upload successful",
        description: "Your document is being processed",
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const { data: documentStatus, isLoading: isPolling } = useQuery({
    queryKey: ['/api/documents', currentDocument?.id],
    queryFn: async () => {
      if (!currentDocument?.id) return null;
      const response = await fetch(`/api/documents/${currentDocument.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch document status');
      return response.json() as Promise<Document>;
    },
    enabled: !!currentDocument?.id && currentDocument.processingStatus !== 'complete',
    refetchInterval: (query) => {
      // Stop polling when complete or error
      const data = query.state.data;
      if (data?.processingStatus === 'complete' || data?.processingStatus === 'error') {
        return false;
      }
      return 1000; // Poll every second
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiRequest('DELETE', `/api/documents/${documentId}`);
      return response.json();
    },
    onSuccess: () => {
      setCurrentDocument(null);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document deleted",
        description: "Document and files have been removed",
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const uploadDocument = useCallback((file: File) => {
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  const deleteDocument = useCallback((documentId: string) => {
    deleteMutation.mutate(documentId);
  }, [deleteMutation]);

  const resetProcessor = useCallback(() => {
    setCurrentDocument(null);
  }, []);

  return {
    currentDocument: documentStatus || currentDocument,
    uploadDocument,
    deleteDocument,
    resetProcessor,
    isUploading: uploadMutation.isPending,
    isPolling,
    uploadError: uploadMutation.error,
  };
}
