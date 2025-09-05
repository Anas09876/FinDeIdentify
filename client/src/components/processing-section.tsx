import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileUp, Search, Bot, Shield, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Document } from "@shared/schema";

interface ProcessingSectionProps {
  document: Document;
  onComplete: (document: Document) => void;
}

export default function ProcessingSection({ document, onComplete }: ProcessingSectionProps) {
  const { data: currentDocument } = useQuery({
    queryKey: ['/api/documents', document.id],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${document.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch document status');
      return response.json() as Promise<Document>;
    },
    refetchInterval: 1000, // Poll every second
  });

  useEffect(() => {
    if (currentDocument?.processingStatus === 'complete') {
      onComplete(currentDocument);
    }
  }, [currentDocument, onComplete]);

  const getStageStatus = (stage: string) => {
    if (!currentDocument) return { status: 'pending', progress: 0 };
    
    const currentStage = currentDocument.processingStatus;
    const stages = ['upload', 'ocr', 'detection', 'redaction', 'complete'];
    const currentIndex = stages.indexOf(currentStage);
    const targetIndex = stages.indexOf(stage);
    
    if (currentIndex > targetIndex) return { status: 'complete', progress: 100 };
    if (currentIndex === targetIndex) return { status: 'processing', progress: 75 };
    return { status: 'pending', progress: 0 };
  };

  const stages = [
    {
      id: 'upload',
      icon: FileUp,
      title: 'File Upload',
      description: 'Document uploaded successfully'
    },
    {
      id: 'ocr',
      icon: Search,
      title: 'OCR Text Extraction',
      description: 'Extracting text from document'
    },
    {
      id: 'detection',
      icon: Bot,
      title: 'AI Detection',
      description: 'Identifying sensitive information'
    },
    {
      id: 'redaction',
      icon: Shield,
      title: 'Redaction',
      description: 'Creating secure version'
    }
  ];

  return (
    <div className="mb-8">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Processing Document</h3>
          <span className="text-sm text-muted-foreground" data-testid="text-processing-status">
            {currentDocument?.processingStatus === 'error' 
              ? 'Processing failed'
              : currentDocument?.processingStatus === 'complete'
              ? 'Processing complete'
              : 'Analyzing content...'
            }
          </span>
        </div>
        
        <div className="space-y-4">
          {stages.map((stage) => {
            const stageStatus = getStageStatus(stage.id);
            const Icon = stage.icon;
            
            return (
              <div key={stage.id} className="flex items-center space-x-3" data-testid={`processing-stage-${stage.id}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  stageStatus.status === 'complete'
                    ? 'bg-green-100 dark:bg-green-900'
                    : stageStatus.status === 'processing'
                    ? 'bg-yellow-100 dark:bg-yellow-900'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    stageStatus.status === 'complete'
                      ? 'text-green-600 dark:text-green-400'
                      : stageStatus.status === 'processing'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-foreground">{stage.title}</span>
                    <span className={`text-sm ${
                      stageStatus.status === 'complete'
                        ? 'text-green-600'
                        : stageStatus.status === 'processing'
                        ? 'text-yellow-600'
                        : 'text-muted-foreground'
                    }`}>
                      {stageStatus.status === 'complete'
                        ? 'Complete'
                        : stageStatus.status === 'processing'
                        ? 'Processing...'
                        : 'Pending'
                      }
                    </span>
                  </div>
                  <Progress 
                    value={stageStatus.progress} 
                    className="h-2" 
                    data-testid={`progress-${stage.id}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Processing time varies based on document size and complexity. Please wait...
            </span>
          </div>
        </div>

        {currentDocument?.processingStatus === 'error' && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-800 dark:text-red-200">
                Processing failed. Please try uploading your document again.
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
