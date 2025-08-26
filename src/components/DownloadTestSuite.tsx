import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Download,
  FileText,
  File,
  Image,
  RefreshCw,
  Bug
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RobustDownloadService } from '@/lib/robustDownloadService';
import { ImprovedDownloadService } from '@/lib/improvedDownloadService';
import { DownloadService } from '@/lib/downloadService';

interface TestResult {
  name: string;
  format: 'pdf' | 'word' | 'png';
  service: 'robust' | 'improved' | 'basic';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  details?: string;
}

interface DownloadTestSuiteProps {
  isVisible: boolean;
  onClose: () => void;
  resumeData: any;
  resumeElementId: string;
}

export const DownloadTestSuite: React.FC<DownloadTestSuiteProps> = ({
  isVisible,
  onClose,
  resumeData,
  resumeElementId
}) => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);
  const [overallProgress, setOverallProgress] = useState(0);
  const { toast } = useToast();
  
  const servicesRef = useRef({
    robust: new RobustDownloadService(),
    improved: new ImprovedDownloadService(),
    basic: new DownloadService()
  });

  // Sample resume data for testing
  const testResumeData = {
    personalInfo: {
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '+1-234-567-8900',
      linkedIn: 'linkedin.com/in/testuser',
      github: 'github.com/testuser',
      objective: 'Test objective for download testing'
    },
    skills: ['JavaScript', 'React', 'Node.js', 'Testing'],
    experience: [
      {
        role: 'Test Engineer',
        company: 'Test Company',
        duration: '2020-2024',
        achievements: ['Tested download functionality', 'Improved user experience']
      }
    ],
    education: [
      {
        degree: 'Bachelor of Testing',
        institution: 'Test University',
        year: '2020'
      }
    ],
    certifications: [
      {
        name: 'Certified Download Tester',
        issuer: 'Testing Institute',
        year: '2024'
      }
    ]
  };

  const initializeTests = (): TestResult[] => [
    // Robust service tests
    { name: 'PDF Download (Robust)', format: 'pdf', service: 'robust', status: 'pending' },
    { name: 'Word Download (Robust)', format: 'word', service: 'robust', status: 'pending' },
    { name: 'PNG Download (Robust)', format: 'png', service: 'robust', status: 'pending' },
    
    // Improved service tests
    { name: 'PDF Download (Improved)', format: 'pdf', service: 'improved', status: 'pending' },
    { name: 'Word Download (Improved)', format: 'word', service: 'improved', status: 'pending' },
    { name: 'PNG Download (Improved)', format: 'png', service: 'improved', status: 'pending' },
    
    // Basic service tests
    { name: 'PDF Download (Basic)', format: 'pdf', service: 'basic', status: 'pending' },
    { name: 'Word Download (Basic)', format: 'word', service: 'basic', status: 'pending' },
    { name: 'PNG Download (Basic)', format: 'png', service: 'basic', status: 'pending' }
  ];

  const runSingleTest = async (test: TestResult): Promise<TestResult> => {
    const startTime = Date.now();
    const service = servicesRef.current[test.service];
    const testData = resumeData || testResumeData;

    try {
      console.log(`🧪 Running test: ${test.name}`);
      
      switch (test.format) {
        case 'pdf':
          await service.downloadAsPDF(testData, resumeElementId);
          break;
        case 'word':
          await service.downloadAsWord(testData);
          break;
        case 'png':
          if (test.service === 'robust') {
            await (service as RobustDownloadService).downloadAsPNG(testData, resumeElementId);
          } else {
            const fileName = `Test_Resume.png`;
            await (service as any).downloadAsPNG(resumeElementId, fileName);
          }
          break;
      }

      const duration = Date.now() - startTime;
      return {
        ...test,
        status: 'passed',
        duration,
        details: `Completed in ${duration}ms`
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Test failed: ${test.name}`, error);
      
      return {
        ...test,
        status: 'failed',
        duration,
        error: errorMessage,
        details: `Failed after ${duration}ms: ${errorMessage}`
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setCurrentTestIndex(0);
    
    const initialTests = initializeTests();
    setTests(initialTests);

    let completedTests = 0;
    const totalTests = initialTests.length;

    try {
      for (let i = 0; i < initialTests.length; i++) {
        setCurrentTestIndex(i);
        const test = initialTests[i];
        
        // Update test status to running
        setTests(prev => prev.map((t, idx) => 
          idx === i ? { ...t, status: 'running' } : t
        ));

        // Run the test
        const result = await runSingleTest(test);
        
        // Update test with result
        setTests(prev => prev.map((t, idx) => 
          idx === i ? result : t
        ));

        completedTests++;
        setOverallProgress((completedTests / totalTests) * 100);

        // Small delay between tests to prevent overwhelming the system
        if (i < initialTests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Show summary
      const passedTests = initialTests.filter((_, i) => i < completedTests).reduce((acc, _, i) => {
        const testElement = document.querySelector(`[data-test-index="${i}"]`);
        return acc + (testElement?.getAttribute('data-status') === 'passed' ? 1 : 0);
      }, 0);

      toast({
        title: "Test Suite Complete",
        description: `${passedTests}/${totalTests} tests passed`,
        duration: 5000,
      });

    } catch (error) {
      console.error('Test suite error:', error);
      toast({
        title: "Test Suite Error",
        description: "An error occurred while running tests",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setCurrentTestIndex(-1);
      setOverallProgress(100);
    }
  };

  const runQuickTest = async () => {
    setIsRunning(true);
    
    const quickTests: TestResult[] = [
      { name: 'Quick PDF Test', format: 'pdf', service: 'robust', status: 'pending' },
      { name: 'Quick PNG Test', format: 'png', service: 'robust', status: 'pending' }
    ];
    
    setTests(quickTests);
    setCurrentTestIndex(0);

    try {
      for (let i = 0; i < quickTests.length; i++) {
        setCurrentTestIndex(i);
        const test = quickTests[i];
        
        setTests(prev => prev.map((t, idx) => 
          idx === i ? { ...t, status: 'running' } : t
        ));

        const result = await runSingleTest(test);
        
        setTests(prev => prev.map((t, idx) => 
          idx === i ? result : t
        ));

        setOverallProgress(((i + 1) / quickTests.length) * 100);

        if (i < quickTests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      const passedCount = quickTests.filter((_, i) => {
        const testResult = tests.find((_, idx) => idx === i);
        return testResult?.status === 'passed';
      }).length;

      toast({
        title: "Quick Test Complete",
        description: `${passedCount}/${quickTests.length} tests passed`,
        duration: 3000,
      });

    } catch (error) {
      console.error('Quick test error:', error);
      toast({
        title: "Quick Test Failed",
        description: "An error occurred during quick testing",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setCurrentTestIndex(-1);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'skipped': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getFormatIcon = (format: 'pdf' | 'word' | 'png') => {
    switch (format) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'word': return <File className="h-4 w-4 text-blue-600" />;
      case 'png': return <Image className="h-4 w-4 text-green-600" />;
    }
  };

  const getServiceBadgeColor = (service: 'robust' | 'improved' | 'basic') => {
    switch (service) {
      case 'robust': return 'bg-green-100 text-green-800 border-green-200';
      case 'improved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'basic': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isVisible) return null;

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const totalTests = tests.length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bug className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Download Test Suite</CardTitle>
                <CardDescription>
                  Comprehensive testing of download functionality across all services and formats
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* Progress */}
          {isRunning && (
            <div className="mt-4 space-y-2">
              <Progress value={overallProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {currentTestIndex >= 0 && currentTestIndex < tests.length ? 
                  `Running: ${tests[currentTestIndex]?.name}` : 
                  'Preparing tests...'
                }
              </p>
            </div>
          )}

          {/* Summary */}
          {tests.length > 0 && !isRunning && (
            <Alert className={failedTests > 0 ? 'border-red-200' : passedTests > 0 ? 'border-green-200' : 'border-blue-200'}>
              {failedTests > 0 ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : passedTests > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-blue-500" />
              )}
              <AlertDescription>
                <strong>Test Results:</strong> {passedTests} passed, {failedTests} failed out of {totalTests} total tests
                {passedTests === totalTests && totalTests > 0 && " - All downloads working perfectly! 🎉"}
                {failedTests > 0 && " - Some download methods may have issues"}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={runQuickTest}
              disabled={isRunning}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Quick Test (2 downloads)
            </Button>
            
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              Full Test Suite (9 downloads)
            </Button>
          </div>

          {/* Test Results */}
          {tests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results</h3>
              {tests.map((test, index) => (
                <Card 
                  key={index} 
                  className={`p-3 transition-colors ${
                    test.status === 'passed' ? 'bg-green-50 border-green-200' :
                    test.status === 'failed' ? 'bg-red-50 border-red-200' :
                    test.status === 'running' ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50'
                  }`}
                  data-test-index={index}
                  data-status={test.status}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      {getFormatIcon(test.format)}
                      <div>
                        <span className="font-medium text-sm">{test.name}</span>
                        {test.details && (
                          <p className="text-xs text-muted-foreground mt-1">{test.details}</p>
                        )}
                        {test.error && (
                          <p className="text-xs text-red-600 mt-1">Error: {test.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getServiceBadgeColor(test.service)}`}
                      >
                        {test.service}
                      </Badge>
                      {test.duration && (
                        <Badge variant="secondary" className="text-xs">
                          {test.duration}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Instructions */}
          {tests.length === 0 && (
            <Alert>
              <Download className="h-4 w-4" />
              <AlertDescription>
                <strong>Download Testing</strong><br />
                This test suite will verify that all download methods work correctly with your resume.
                <br /><br />
                • <strong>Quick Test:</strong> Tests the most reliable download methods (PDF & PNG with Robust service)
                <br />
                • <strong>Full Test Suite:</strong> Tests all combinations of formats and services
                <br /><br />
                <em>Note: Running tests will actually trigger downloads - make sure to allow downloads in your browser.</em>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};