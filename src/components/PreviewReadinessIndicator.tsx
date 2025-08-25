import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Eye,
  Clock,
  Loader2
} from 'lucide-react';
import { usePreviewReadiness } from '@/hooks/usePreviewReadiness';

interface PreviewReadinessIndicatorProps {
  elementId?: string;
  showDetails?: boolean;
  onStatusChange?: (isReady: boolean) => void;
}

export const PreviewReadinessIndicator: React.FC<PreviewReadinessIndicatorProps> = ({ 
  elementId = 'resume-preview-element',
  showDetails = false,
  onStatusChange
}) => {
  const {
    isReady,
    isChecking,
    error,
    retryCount,
    lastChecked,
    forceCheck
  } = usePreviewReadiness({ elementId });

  // Notify parent component of status changes
  React.useEffect(() => {
    onStatusChange?.(isReady);
  }, [isReady, onStatusChange]);

  const getStatusBadge = () => {
    if (isChecking) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Checking...
        </Badge>
      );
    }
    
    if (isReady) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 gap-1">
          <CheckCircle className="h-3 w-3" />
          Ready
        </Badge>
      );
    }
    
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Not Ready
      </Badge>
    );
  };

  const getStatusIcon = () => {
    if (isChecking) return <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />;
    if (isReady) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getStatusMessage = () => {
    if (isChecking) return 'Checking preview status...';
    if (isReady) return 'Resume preview is ready for download';
    if (error) return error;
    return 'Resume preview not ready';
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 1) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        {getStatusBadge()}
        {!isReady && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={forceCheck}
            disabled={isChecking}
            className="h-6 px-2"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert className={isReady ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
      <div className="flex items-start gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <AlertDescription>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{getStatusMessage()}</span>
              {getStatusBadge()}
            </div>
            
            {showDetails && (
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Last checked:</span>
                  <span>{formatTime(lastChecked)}</span>
                </div>
                {retryCount > 0 && (
                  <div className="flex justify-between">
                    <span>Retry count:</span>
                    <span>{retryCount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Element ID:</span>
                  <code className="text-xs bg-gray-200 px-1 rounded">{elementId}</code>
                </div>
              </div>
            )}
            
            <div className="mt-3 flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={forceCheck}
                disabled={isChecking}
                className="gap-1"
              >
                {isChecking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {isChecking ? 'Checking...' : 'Check Again'}
              </Button>
              
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  const element = document.getElementById(elementId);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="gap-1"
              >
                <Eye className="h-3 w-3" />
                View Element
              </Button>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};