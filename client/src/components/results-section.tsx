import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Download, Share, RotateCcw } from "lucide-react";
import { type Document, type SensitiveDataDetection } from "@shared/schema";
import DocumentViewer from "./document-viewer";
import { useToast } from "@/hooks/use-toast";

interface ResultsSectionProps {
  document: Document;
  onStartOver: () => void;
}

export default function ResultsSection({ document, onStartOver }: ResultsSectionProps) {
  const { toast } = useToast();
  const sensitiveData = document.detectedSensitiveData as SensitiveDataDetection | null;

  const handleDownload = async (type: 'original' | 'redacted') => {
    try {
      const response = await fetch(`/api/documents/${document.id}/file/${type}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${type}_${document.filename}`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: `${type === 'redacted' ? 'Redacted' : 'Original'} document download started`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const getTotalDetections = () => {
    if (!sensitiveData) return 0;
    return (
      sensitiveData.aadhaarNumbers.length +
      sensitiveData.panNumbers.length +
      sensitiveData.phoneNumbers.length +
      sensitiveData.blurredRegions.length
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Document Comparison</h3>
          <p className="text-muted-foreground">Original vs. Redacted Version</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-muted-foreground">
              {getTotalDetections()} sensitive items detected
            </span>
          </div>
          <Button 
            onClick={() => handleDownload('redacted')}
            data-testid="button-download-redacted"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Redacted PDF
          </Button>
        </div>
      </div>

      {/* Detection Summary */}
      {sensitiveData && (
        <Card className="p-4 mb-6">
          <h4 className="font-semibold text-foreground mb-3">Detection Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center" data-testid="summary-aadhaar">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {sensitiveData.aadhaarNumbers.length}
              </div>
              <div className="text-sm text-muted-foreground">Aadhaar Numbers</div>
            </div>
            <div className="text-center" data-testid="summary-pan">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {sensitiveData.panNumbers.length}
              </div>
              <div className="text-sm text-muted-foreground">PAN Numbers</div>
            </div>
            <div className="text-center" data-testid="summary-phone">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {sensitiveData.phoneNumbers.length}
              </div>
              <div className="text-sm text-muted-foreground">Phone Numbers</div>
            </div>
            <div className="text-center" data-testid="summary-images">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {sensitiveData.blurredRegions.length}
              </div>
              <div className="text-sm text-muted-foreground">Images Blurred</div>
            </div>
          </div>
        </Card>
      )}

      {/* Comparison View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="p-4 border-b border-border">
            <h4 className="font-semibold text-foreground flex items-center">
              <FileText className="mr-2 text-blue-600 h-4 w-4" />
              Original Document
            </h4>
          </div>
          <div className="p-4">
            <DocumentViewer
              documentId={document.id}
              type="original"
              className="h-[600px]"
            />
          </div>
        </Card>

        <Card>
          <div className="p-4 border-b border-border">
            <h4 className="font-semibold text-foreground flex items-center">
              <Shield className="mr-2 text-green-600 h-4 w-4" />
              Redacted Document
              <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                Secure
              </span>
            </h4>
          </div>
          <div className="p-4">
            <DocumentViewer
              documentId={document.id}
              type="redacted"
              className="h-[600px]"
            />
          </div>
        </Card>
      </div>

      {/* Detailed Changes */}
      {sensitiveData && (
        <Card className="mb-6">
          <div className="p-4 border-b border-border">
            <h4 className="font-semibold text-foreground">Detailed Changes</h4>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {sensitiveData.aadhaarNumbers.map((aadhaar, index) => (
                <div key={`aadhaar-${index}`} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-red-600 dark:text-red-400 h-4 w-4" />
                    <div>
                      <span className="font-medium text-red-800 dark:text-red-200">Aadhaar Number</span>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {aadhaar.original} → {aadhaar.redacted}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                    Masked
                  </span>
                </div>
              ))}
              
              {sensitiveData.panNumbers.map((pan, index) => (
                <div key={`pan-${index}`} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-red-600 dark:text-red-400 h-4 w-4" />
                    <div>
                      <span className="font-medium text-red-800 dark:text-red-200">PAN Number</span>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {pan.original} → {pan.redacted}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                    Masked
                  </span>
                </div>
              ))}
              
              {sensitiveData.phoneNumbers.map((phone, index) => (
                <div key={`phone-${index}`} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-red-600 dark:text-red-400 h-4 w-4" />
                    <div>
                      <span className="font-medium text-red-800 dark:text-red-200">Phone Number</span>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {phone.original} → {phone.redacted}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                    Masked
                  </span>
                </div>
              ))}

              {sensitiveData.blurredRegions.map((region, index) => (
                <div key={`region-${index}`} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-red-600 dark:text-red-400 h-4 w-4" />
                    <div>
                      <span className="font-medium text-red-800 dark:text-red-200">
                        {region.type === 'photo' ? 'Profile Photo' : region.type === 'signature' ? 'Signature' : 'QR Code'}
                      </span>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Sensitive visual content detected and blurred
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                    Blurred
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          className="flex-1" 
          onClick={() => handleDownload('redacted')}
          data-testid="button-download-main"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Redacted PDF
        </Button>
        <Button 
          variant="secondary" 
          className="flex-1"
          data-testid="button-share"
        >
          <Share className="mr-2 h-4 w-4" />
          Share Secure Link
        </Button>
        <Button 
          variant="outline" 
          onClick={onStartOver}
          data-testid="button-start-over"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Process Another
        </Button>
      </div>
    </div>
  );
}
