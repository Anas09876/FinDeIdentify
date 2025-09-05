import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudUpload, FolderOpen, IdCard, EyeOff, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Document } from "@shared/schema";

interface UploadZoneProps {
  onUploadComplete: (document: Document) => void;
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF, JPG, or PNG file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await apiRequest('POST', '/api/documents/upload', formData);
      const document: Document = await response.json();
      
      toast({
        title: "Upload successful",
        description: "Your document is being processed",
      });

      onUploadComplete(document);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Protect Sensitive Information</h2>
        <p className="text-lg text-muted-foreground">Automatically detect and redact sensitive data from your documents</p>
      </div>
      
      <Card className="p-6 mb-6">
        <div
          className={`rounded-lg p-8 text-center cursor-pointer border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary hover:bg-accent'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          data-testid="upload-zone"
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CloudUpload className="text-primary h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {isUploading ? 'Uploading...' : 'Drop files here or click to upload'}
            </h3>
            <p className="text-muted-foreground mb-4">Supports PDF, JPG, PNG files up to 10MB</p>
            <Button disabled={isUploading} data-testid="button-upload">
              <FolderOpen className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Choose Files'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              data-testid="input-file"
            />
          </div>
        </div>
      </Card>

      {/* Supported Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <IdCard className="text-blue-600 dark:text-blue-400 h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">ID Detection</h4>
              <p className="text-sm text-muted-foreground">Aadhaar, PAN, Phone Numbers</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <EyeOff className="text-green-600 dark:text-green-400 h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Image Redaction</h4>
              <p className="text-sm text-muted-foreground">Photos, Signatures, QR Codes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Download className="text-purple-600 dark:text-purple-400 h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Secure Export</h4>
              <p className="text-sm text-muted-foreground">Download Redacted PDF</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
