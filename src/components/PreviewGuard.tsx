import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  Clock,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { usePreviewReadiness } from '@/hooks/usePreviewReadiness';

interface PreviewGuardProps {
  onPreviewReady: () => void;
  onGoToPreview: () => void;
  children: React.ReactNode;
  autoWait?: boolean;
  showPreviewButton?: boolean;
}

export const PreviewGuard: React.FC<PreviewGuardProps> = ({ 
  onPreviewReady, 
  onGoToPreview,
  children,
  autoWait = true,
  showPreviewButton = true
}) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitProgress, setWaitProgress] = useState(0);
  
  const {
    isReady,
    isChecking,
    error,
    retryCount,
    lastChecked,
    waitForPreviewReadiness,
    forceCheck,
    config
  } = usePreviewReadiness({
    elementId: 'resume-preview-element',
    maxRetries: 5,
    retryDelay: 1000,
    checkInterval: 500,
    timeout: 15000
  });

  const handleWaitForPreview = async () => {
    setIsWaiting(true);
    setWaitProgress(0);

    // Progress simulation during wait
    const progressInterval = setInterval(() => {
      setWaitProgress(prev => {
        if (prev >= 90) return prev;
        return prev + (Math.random() * 10);
      });
    }, 200);

    try {
      const ready = await waitForPreviewReadiness();
      
      clearInterval(progressInterval);
      setWaitProgress(100);
      
      if (ready) {
        setTimeout(() => {
          onPreviewReady();
          setIsWaiting(false);
          setWaitProgress(0);
        }, 500);
      } else {
        setIsWaiting(false);
        setWaitProgress(0);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setIsWaiting(false);
      setWaitProgress(0);
    }
  };

  // If preview is ready, render children (download options)
  if (isReady) {
    return <>{children}</>;
  }

  // If auto-waiting is enabled and we're not already waiting, start waiting
  React.useEffect(() => {
    if (autoWait && !isReady && !isWaiting && !isChecking) {
      const timer = setTimeout(() => {
        handleWaitForPreview();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoWait, isReady, isWaiting, isChecking]);

  const getStatusIcon = () => {
    if (isWaiting) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    if (isChecking) return <RefreshCw className="h-5 w-5 animate-spin text-orange-500" />;
    if (error) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-gray-500" />;
  };

  const getStatusMessage = () => {
    if (isWaiting) return 'Waiting for resume preview to load...';
    if (isChecking) return 'Checking preview status...';
    if (error) return error;
    return 'Resume preview not ready for download';
  };

  const formatLastChecked = () => {
    if (!lastChecked) return 'Never';
    const seconds = Math.floor((Date.now() - lastChecked) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Resume Download
        </h2>
        <p className="text-muted-foreground">
          Preparing your resume for download...
        </p>
      </div>

      {/* Main Status Card */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Preview Status Check
          </CardTitle>
          <CardDescription>
            {getStatusMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Progress Bar (when waiting) */}
          {isWaiting && (
            <div className="space-y-2">
              <Progress value={waitProgress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Attempt {retryCount + 1} of {config.maxRetries}
              </p>
            </div>
          )}

          {/* Status Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Last Check:</span>
              <span className="ml-2 text-muted-foreground">{formatLastChecked()}</span>
            </div>
            <div>
              <span className="font-medium">Retry Count:</span>
              <span className="ml-2 text-muted-foreground">{retryCount}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {showPreviewButton && (
              <Button 
                onClick={onGoToPreview}
                variant="outline"
                className="gap-2 flex-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Preview
              </Button>
            )}
            
            <Button 
              onClick={handleWaitForPreview}
              disabled={isWaiting || isChecking}
              className="gap-2 flex-1"
            >
              {isWaiting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isWaiting ? 'Waiting...' : 'Wait for Preview'}
            </Button>
            
            <Button 
              onClick={forceCheck}
              variant="outline"
              disabled={isWaiting || isChecking}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Check Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Helpful Instructions */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p>
              <strong>Resume preview not found.</strong> To download your resume, the preview must be ready first.
            </p>
            <div className="text-sm space-y-1">
              <p>• Make sure you've completed the resume preview step</p>
              <p>• Check that your resume content has loaded properly</p>
              <p>• Try refreshing the page if the preview isn't showing</p>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Alternative Actions */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3">Alternative Actions</h4>
          <div className="space-y-2 text-sm">
            <p>If the preview won't load, you can:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Go back to the preview step and verify your content</li>
              <li>Edit your resume information and try again</li>
              <li>Refresh your browser and start the process over</li>
              <li>Try using a different browser if issues persist</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify({ 
              isReady, 
              isChecking, 
              error, 
              retryCount, 
              lastChecked,
              config 
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};