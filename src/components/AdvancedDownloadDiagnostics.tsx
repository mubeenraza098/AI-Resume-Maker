import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Monitor,
  Globe,
  Settings,
  Bug,
  Copy,
  Download
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DownloadDebugger } from '@/lib/downloadDebugger';

interface DiagnosticResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  details?: string;
  recommendation?: string;
}

interface AdvancedDownloadDiagnosticsProps {
  isVisible: boolean;
  onClose: () => void;
  elementId: string;
  onRetryDownload?: (format: 'pdf' | 'word' | 'png') => void;
}

export const AdvancedDownloadDiagnostics: React.FC<AdvancedDownloadDiagnosticsProps> = ({
  isVisible,
  onClose,
  elementId,
  onRetryDownload
}) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    setDiagnostics([]);
    
    const results: DiagnosticResult[] = [];

    try {
      // 1. Browser Compatibility Check
      setProgress(10);
      const browserSupport = DownloadDebugger.checkBrowserSupport();
      results.push({
        category: 'Browser',
        name: 'Download Compatibility',
        status: browserSupport.supported ? 'pass' : 'fail',
        message: browserSupport.supported ? 'Browser supports all download features' : 'Browser has compatibility issues',
        details: browserSupport.issues.join(', ') || undefined,
        recommendation: browserSupport.recommendations[0]
      });

      // 2. Network & Security Check
      setProgress(20);
      results.push({
        category: 'Security',
        name: 'HTTPS Protocol',
        status: location.protocol === 'https:' || location.hostname === 'localhost' ? 'pass' : 'warning',
        message: location.protocol === 'https:' || location.hostname === 'localhost' ? 'Running in secure context' : 'Not running on HTTPS',
        recommendation: 'Some download features work better on HTTPS sites'
      });

      // 3. Popup Blocker Check
      setProgress(30);
      try {
        const testWindow = window.open('', '_blank', 'width=1,height=1');
        if (testWindow) {
          testWindow.close();
          results.push({
            category: 'Browser',
            name: 'Popup Blocker',
            status: 'pass',
            message: 'Popups are allowed',
          });
        } else {
          results.push({
            category: 'Browser',
            name: 'Popup Blocker',
            status: 'warning',
            message: 'Popup blocker may interfere with downloads',
            recommendation: 'Allow popups for this site in browser settings'
          });
        }
      } catch (error) {
        results.push({
          category: 'Browser',
          name: 'Popup Blocker',
          status: 'fail',
          message: 'Popup blocker is active',
          recommendation: 'Disable popup blocker for this site'
        });
      }

      // 4. Element Detection Check
      setProgress(50);
      const element = document.getElementById(elementId);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        const hasContent = element.children.length > 0 || (element.textContent?.trim().length || 0) > 0;
        const inViewport = rect.top >= 0 && rect.left >= 0 && 
                          rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
        
        results.push({
          category: 'Element',
          name: 'Resume Element Found',
          status: 'pass',
          message: `Found element with ID "${elementId}"`,
          details: `Dimensions: ${rect.width}×${rect.height}px, Children: ${element.children.length}`,
        });

        results.push({
          category: 'Element',
          name: 'Element Visibility',
          status: isVisible ? 'pass' : 'fail',
          message: isVisible ? 'Element is visible' : 'Element has no dimensions',
          recommendation: !isVisible ? 'Element may be hidden or not rendered properly' : undefined
        });

        results.push({
          category: 'Element',
          name: 'Element Content',
          status: hasContent ? 'pass' : 'fail',
          message: hasContent ? 'Element contains content' : 'Element appears to be empty',
          recommendation: !hasContent ? 'Make sure resume content has loaded' : undefined
        });

        results.push({
          category: 'Element',
          name: 'Viewport Position',
          status: inViewport ? 'pass' : 'info',
          message: inViewport ? 'Element is in viewport' : 'Element is outside viewport',
          details: `Position: ${Math.round(rect.top)}, ${Math.round(rect.left)}`
        });
      } else {
        results.push({
          category: 'Element',
          name: 'Resume Element Found',
          status: 'fail',
          message: `Element with ID "${elementId}" not found`,
          recommendation: 'Make sure you are on the resume preview page'
        });
      }

      // 5. Canvas Support Check
      setProgress(70);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 100;
          canvas.height = 100;
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(0, 0, 50, 50);
          const dataUrl = canvas.toDataURL('image/png');
          
          results.push({
            category: 'Rendering',
            name: 'Canvas Support',
            status: dataUrl.startsWith('data:image/png') ? 'pass' : 'fail',
            message: 'Canvas rendering is functional',
          });
        } else {
          throw new Error('Canvas context not available');
        }
      } catch (error) {
        results.push({
          category: 'Rendering',
          name: 'Canvas Support',
          status: 'fail',
          message: 'Canvas rendering failed',
          recommendation: 'Update your browser or enable hardware acceleration'
        });
      }

      // 6. File API Support
      setProgress(80);
      results.push({
        category: 'Browser',
        name: 'File API Support',
        status: typeof Blob !== 'undefined' && typeof URL.createObjectURL !== 'undefined' ? 'pass' : 'fail',
        message: typeof Blob !== 'undefined' && typeof URL.createObjectURL !== 'undefined' ? 'File APIs are available' : 'File APIs not supported',
        recommendation: typeof Blob === 'undefined' || typeof URL.createObjectURL === 'undefined' ? 'Use a modern browser' : undefined
      });

      // 7. Memory Check
      setProgress(90);
      if ('memory' in performance) {
        const memInfo = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
        const usedMemoryMB = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
        const totalMemoryMB = Math.round(memInfo.totalJSHeapSize / 1024 / 1024);
        
        results.push({
          category: 'Performance',
          name: 'Memory Usage',
          status: usedMemoryMB < 100 ? 'pass' : usedMemoryMB < 200 ? 'warning' : 'fail',
          message: `Using ${usedMemoryMB}MB of ${totalMemoryMB}MB`,
          recommendation: usedMemoryMB > 200 ? 'Close other tabs to free memory' : undefined
        });
      }

      // 8. Resolution Check
      const pixelRatio = window.devicePixelRatio || 1;
      results.push({
        category: 'Display',
        name: 'Display Resolution',
        status: 'info',
        message: `Screen: ${screen.width}×${screen.height}, Pixel ratio: ${pixelRatio}x`,
        details: `Viewport: ${window.innerWidth}×${window.innerHeight}`,
      });

      setProgress(100);
      setDiagnostics(results);

    } catch (error) {
      console.error('Diagnostics failed:', error);
      toast({
        title: "Diagnostic Error",
        description: "Failed to complete diagnostics. Please refresh and try again.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const copyDiagnosticReport = () => {
    const report = `=== Download Diagnostic Report ===
Generated: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Element ID: ${elementId}

${diagnostics.map(result => 
`[${result.status.toUpperCase()}] ${result.category} - ${result.name}
  ${result.message}
  ${result.details ? `Details: ${result.details}` : ''}
  ${result.recommendation ? `Recommendation: ${result.recommendation}` : ''}
`).join('\n')}

Browser Support Details:
${DownloadDebugger.generateDiagnosticReport()}
`;

    navigator.clipboard.writeText(report).then(() => {
      toast({
        title: "Report Copied",
        description: "Diagnostic report copied to clipboard",
      });
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = report;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Report Copied",
        description: "Diagnostic report copied to clipboard",
      });
    });
  };

  useEffect(() => {
    if (isVisible) {
      runDiagnostics();
    }
  }, [isVisible, runDiagnostics]);

  if (!isVisible) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Monitor className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 border-green-200';
      case 'fail': return 'bg-red-100 border-red-200';
      case 'warning': return 'bg-orange-100 border-orange-200';
      default: return 'bg-blue-100 border-blue-200';
    }
  };

  const criticalIssues = diagnostics.filter(d => d.status === 'fail').length;
  const warnings = diagnostics.filter(d => d.status === 'warning').length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bug className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Download Diagnostics</CardTitle>
                <CardDescription>
                  Comprehensive analysis of download functionality
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={runDiagnostics}
                disabled={isRunning}
              >
                <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>

          {isRunning && (
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Running diagnostics... {progress}%
              </p>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Summary */}
          {!isRunning && diagnostics.length > 0 && (
            <Alert className={criticalIssues > 0 ? 'border-red-200' : warnings > 0 ? 'border-orange-200' : 'border-green-200'}>
              {criticalIssues > 0 ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : warnings > 0 ? (
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>
                      {criticalIssues > 0 ? 'Critical Issues Detected' : 
                       warnings > 0 ? 'Some Issues Found' : 'All Systems OK'}
                    </strong>
                    <br />
                    {criticalIssues > 0 && `${criticalIssues} critical issue(s) `}
                    {warnings > 0 && `${warnings} warning(s) `}
                    {criticalIssues === 0 && warnings === 0 && 'No issues detected - downloads should work properly'}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyDiagnosticReport}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Report
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Diagnostic Results */}
          {diagnostics.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Diagnostic Results</h3>
              
              {['Browser', 'Security', 'Element', 'Rendering', 'Performance', 'Display'].map(category => {
                const categoryResults = diagnostics.filter(d => d.category === category);
                if (categoryResults.length === 0) return null;
                
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      {category}
                    </h4>
                    {categoryResults.map((result, index) => (
                      <Card key={index} className={`p-3 ${getStatusColor(result.status)}`}>
                        <div className="flex items-start gap-3">
                          {getStatusIcon(result.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{result.name}</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  result.status === 'pass' ? 'text-green-700 border-green-300' :
                                  result.status === 'fail' ? 'text-red-700 border-red-300' :
                                  result.status === 'warning' ? 'text-orange-700 border-orange-300' :
                                  'text-blue-700 border-blue-300'
                                }`}
                              >
                                {result.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm mt-1">{result.message}</p>
                            {result.details && (
                              <p className="text-xs text-muted-foreground mt-1">{result.details}</p>
                            )}
                            {result.recommendation && (
                              <p className="text-xs mt-2 p-2 bg-white/50 rounded">
                                <strong>💡 Recommendation:</strong> {result.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          {onRetryDownload && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Try Downloads Again</h3>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => onRetryDownload('pdf')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Retry PDF
                </Button>
                <Button
                  onClick={() => onRetryDownload('word')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Retry Word
                </Button>
                <Button
                  onClick={() => onRetryDownload('png')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Retry PNG
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};