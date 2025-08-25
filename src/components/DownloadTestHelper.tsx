import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const DownloadTestHelper: React.FC = () => {
  const checkElementExists = () => {
    const element = document.getElementById('resume-preview-element');
    const isVisible = element && element.offsetWidth > 0 && element.offsetHeight > 0;
    const hasContent = element && (element.children.length > 0 || element.textContent?.trim().length > 0);
    
    console.log('Element Check Results:', {
      exists: !!element,
      visible: isVisible,
      hasContent: hasContent,
      dimensions: element ? { width: element.offsetWidth, height: element.offsetHeight } : null,
      childrenCount: element?.children.length,
      textLength: element?.textContent?.trim().length
    });

    return {
      exists: !!element,
      visible: !!isVisible,
      hasContent: !!hasContent,
      ready: !!(element && isVisible && hasContent)
    };
  };

  const [testResults, setTestResults] = React.useState(checkElementExists());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTestResults(checkElementExists());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Download Element Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {testResults.exists ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm">Element exists: {testResults.exists ? 'Yes' : 'No'}</span>
        </div>

        <div className="flex items-center gap-2">
          {testResults.visible ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm">Element visible: {testResults.visible ? 'Yes' : 'No'}</span>
        </div>

        <div className="flex items-center gap-2">
          {testResults.hasContent ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm">Has content: {testResults.hasContent ? 'Yes' : 'No'}</span>
        </div>

        <Alert className={testResults.ready ? 'border-green-200' : 'border-red-200'}>
          {testResults.ready ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription>
            {testResults.ready ? 
              '✅ Element is ready for download!' : 
              '❌ Element not ready - downloads may fail'
            }
          </AlertDescription>
        </Alert>

        <Button 
          onClick={() => setTestResults(checkElementExists())} 
          size="sm" 
          variant="outline"
          className="w-full"
        >
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
};