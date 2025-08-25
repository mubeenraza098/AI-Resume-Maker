import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bug, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download,
  Clipboard,
  RefreshCw
} from 'lucide-react';
import { DownloadDebugger } from '@/lib/downloadDebugger';
import { useToast } from '@/components/ui/use-toast';

interface DownloadDebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DownloadDebugPanel: React.FC<DownloadDebugPanelProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const { toast } = useToast();

  if (!isVisible) return null;

  const runDiagnostics = async () => {
    setIsRunningTest(true);
    try {
      const results = await DownloadDebugger.testDownloadCapability();
      setTestResults(results);
      
      if (results.canDownload) {
        toast({
          title: "Diagnostics Complete ✅",
          description: "Your browser supports all download features!",
        });
      } else {
        toast({
          title: "Issues Detected ⚠️", 
          description: `Found ${results.errors.length} compatibility issues.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Diagnostics Failed",
        description: "Unable to run diagnostics. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  const copyDiagnosticReport = () => {
    const report = DownloadDebugger.generateDiagnosticReport();
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(report).then(() => {
        toast({
          title: "Report Copied",
          description: "Diagnostic report copied to clipboard.",
        });
      });
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = report;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Report Copied",
        description: "Diagnostic report copied to clipboard.",
      });
    }
  };

  const browserSupport = DownloadDebugger.checkBrowserSupport();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              <CardTitle>Download Troubleshooting</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          <CardDescription>
            Diagnose and fix download issues with your browser and system.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Browser Compatibility */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              {browserSupport.supported ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Browser Compatibility
            </h3>
            
            <Alert className={browserSupport.supported ? 'border-green-200' : 'border-red-200'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {browserSupport.supported ? (
                  "✅ Your browser supports all download features!"
                ) : (
                  `❌ ${browserSupport.issues.length} compatibility issues detected`
                )}
              </AlertDescription>
            </Alert>

            {browserSupport.issues.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-red-600 mb-2">Issues:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {browserSupport.issues.map((issue, index) => (
                    <li key={index} className="text-red-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {browserSupport.recommendations.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-blue-600 mb-2">Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {browserSupport.recommendations.map((rec, index) => (
                    <li key={index} className="text-blue-600">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Test Results */}
          {testResults && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Test Results
              </h3>
              
              <div className="space-y-2">
                {Object.entries(testResults.testResults).map(([test, passed]) => (
                  <div key={test} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium capitalize">
                      {test.replace('_', ' ')}
                    </span>
                    <Badge variant={passed ? 'default' : 'destructive'}>
                      {passed ? '✅ Pass' : '❌ Fail'}
                    </Badge>
                  </div>
                ))}
              </div>

              {testResults.errors.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {testResults.errors.map((error: string, index: number) => (
                      <li key={index} className="text-red-600">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Common Issues & Solutions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Common Issues & Solutions</h3>
            <div className="space-y-3">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Downloads not starting:</strong> Check if popup blockers are enabled or if you're on a non-HTTPS site.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Files corrupted:</strong> Try clearing browser cache and cookies, then refresh the page.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Slow generation:</strong> Large resumes may take longer. Wait for the progress indicator to complete.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={runDiagnostics}
              disabled={isRunningTest}
              className="gap-2"
            >
              {isRunningTest ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Bug className="h-4 w-4" />
              )}
              {isRunningTest ? 'Running...' : 'Run Diagnostics'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={copyDiagnosticReport}
              className="gap-2"
            >
              <Clipboard className="h-4 w-4" />
              Copy Report
            </Button>
          </div>

          {/* System Info */}
          <div className="pt-4 border-t">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">System Information</summary>
              <div className="mt-2 space-y-1 text-gray-600">
                <p><strong>User Agent:</strong> {navigator.userAgent}</p>
                <p><strong>Platform:</strong> {navigator.platform}</p>
                <p><strong>Language:</strong> {navigator.language}</p>
                <p><strong>URL:</strong> {window.location.href}</p>
                <p><strong>Secure Context:</strong> {window.isSecureContext ? 'Yes' : 'No'}</p>
              </div>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};