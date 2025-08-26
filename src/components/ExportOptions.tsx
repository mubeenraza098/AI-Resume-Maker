import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  Download, 
  FileText, 
  File, 
  Image, 
  Share2,
  CheckCircle,
  Zap,
  Globe,
  Mail,
  Linkedin,
  Twitter,
  Facebook,
  MessageCircle,
  Copy,
  Loader2,
  Bug
} from 'lucide-react';
import { 
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton
} from 'react-share';
import { DownloadService, DownloadProgress as BasicDownloadProgress } from '@/lib/downloadService';
import { ImprovedDownloadService, DownloadProgress as ImprovedDownloadProgress } from '@/lib/improvedDownloadService';
import { RobustDownloadService, DownloadProgress as RobustDownloadProgress } from '@/lib/robustDownloadService';
import { ResumeData } from './ResumeBuilder';
import { SharingService } from '@/lib/sharingService';
import { DownloadDebugPanel } from './DownloadDebugPanel';
import { AdvancedDownloadDiagnostics } from './AdvancedDownloadDiagnostics';
import { DownloadTestSuite } from './DownloadTestSuite';
import { ManualDownloadFallback } from './ManualDownloadFallback';
import { PreviewReadinessIndicator } from './PreviewReadinessIndicator';

interface ExportOptionsProps {
  onExport?: (format: 'pdf' | 'word' | 'png') => void;
  resumeData: ResumeData;
  resumeElementId?: string;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ 
  onExport, 
  resumeData, 
  resumeElementId = 'resume-preview' 
}) => {
  const [downloadProgress, setDownloadProgress] = useState<RobustDownloadProgress | null>(null);
  const [progressTimeout, setProgressTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showAdvancedDiagnostics, setShowAdvancedDiagnostics] = useState(false);
  const [showTestSuite, setShowTestSuite] = useState(false);
  const [failedDownloads, setFailedDownloads] = useState<Set<string>>(new Set());
  const [showManualFallback, setShowManualFallback] = useState<{format: 'pdf' | 'word' | 'png'} | null>(null);
  const { toast } = useToast();
  
  // Use robust download service for maximum reliability
  const robustDownloadService = new RobustDownloadService((progress: RobustDownloadProgress) => {
    setDownloadProgress(progress);
    
    // Clear previous timeout and set new one to detect hanging
    if (progressTimeout) clearTimeout(progressTimeout);
    
    // If progress hasn't changed in 30 seconds, consider it hung
    const newTimeout = setTimeout(() => {
      console.warn('⚠️ Download progress appears to be hanging...');
      if (progress.stage !== 'complete' && progress.stage !== 'error') {
        console.error('🚫 Progress timeout - forcing error state');
        setDownloadProgress({
          ...progress,
          stage: 'error',
          message: 'Download appears to be stuck. Please try again.'
        });
      }
    }, 30000);
    
    setProgressTimeout(newTimeout);
  });
  
  // Keep fallback services for progressive degradation
  const improvedDownloadService = new ImprovedDownloadService((progress: ImprovedDownloadProgress) => {
    const robustProgress = progress as RobustDownloadProgress;
    setDownloadProgress(robustProgress);
    
    // Clear previous timeout and set new one
    if (progressTimeout) clearTimeout(progressTimeout);
    const newTimeout = setTimeout(() => {
      console.warn('⚠️ Download progress appears to be hanging (improved service)...');
      if (robustProgress.stage !== 'complete' && robustProgress.stage !== 'error') {
        setDownloadProgress({
          ...robustProgress,
          stage: 'error',
          message: 'Download appears to be stuck. Please try again.'
        });
      }
    }, 30000);
    setProgressTimeout(newTimeout);
  });
  
  const basicDownloadService = new DownloadService((progress: BasicDownloadProgress) => {
    const robustProgress = progress as RobustDownloadProgress;
    setDownloadProgress(robustProgress);
    
    // Clear previous timeout and set new one
    if (progressTimeout) clearTimeout(progressTimeout);
    const newTimeout = setTimeout(() => {
      console.warn('⚠️ Download progress appears to be hanging (basic service)...');
      if (robustProgress.stage !== 'complete' && robustProgress.stage !== 'error') {
        setDownloadProgress({
          ...robustProgress,
          stage: 'error',
          message: 'Download appears to be stuck. Please try again.'
        });
      }
    }, 30000);
    setProgressTimeout(newTimeout);
  });
  
  const sharingService = new SharingService();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (progressTimeout) {
        clearTimeout(progressTimeout);
      }
    };
  }, [progressTimeout]);

  const handleDownload = async (format: 'pdf' | 'word' | 'png') => {
    console.log(`🚀 [DOWNLOAD START] Format: ${format}`);
    
    try {
      setIsDownloading(format);
      setDownloadProgress(null);
      
      // Remove from failed downloads set when retrying
      setFailedDownloads(prev => {
        const newSet = new Set(prev);
        newSet.delete(format);
        return newSet;
      });

      // Show starting toast
      toast({
        title: "Download Starting",
        description: `Preparing your ${format.toUpperCase()} download...`,
      });

      // Use robust download service for direct downloads
      const service = robustDownloadService;
      
      // Check if resume element exists before attempting download
      const elementId = resumeElementId || 'resume-preview-element';
      const resumeElement = document.getElementById(elementId) || 
                          document.querySelector('[id*="resume-preview"]') ||
                          document.querySelector('[class*="resume-preview"]') ||
                          document.querySelector('[data-testid="resume-preview"]');
                          
      if (!resumeElement) {
        throw new Error(`Resume element not found. Looking for: ${elementId}. Please ensure the resume preview is visible on the page.`);
      }
      
      console.log(`✅ Found resume element:`, resumeElement);
      
      // Execute download based on format
      switch (format) {
        case 'pdf':
          console.log(`📄 Downloading PDF using element: ${elementId}`);
          await service.downloadAsPDF(resumeData, elementId);
          break;
        case 'word':
          console.log('📝 Downloading Word document...');
          await service.downloadAsWord(resumeData);
          break;
        case 'png':
          console.log(`🖼️ Downloading PNG using element: ${elementId}`);
          await service.downloadAsPNG(resumeData, elementId);
          break;
      }
      
      console.log(`✅ [SUCCESS] ${format} download completed successfully`);

      // Success! Show success toast
      toast({
        title: `Download Complete! 📄`,
        description: `Your resume has been downloaded as ${format.toUpperCase()}. Check your downloads folder.`,
        duration: 5000,
      });

      // Call the original onExport if provided
      onExport?.(format);

    } catch (error) {
      console.error(`🚫 [ERROR] Download error:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const isElementError = errorMessage.includes('not found') || errorMessage.includes('Element');
      
      // Mark as failed
      setFailedDownloads(prev => new Set(prev).add(format));
      
      const errorDescription = isElementError 
        ? `Cannot locate resume content on page. Please ensure you're viewing the resume preview and try again.`
        : `Download failed for ${format.toUpperCase()}: ${errorMessage}`;
        
      toast({
        title: "Download Failed ❌",
        description: errorDescription,
        variant: "destructive",
        duration: 10000,
      });
      
      // Show manual fallback for failed downloads
      setShowManualFallback({format: format as 'pdf' | 'word' | 'png'});
    } finally {
      // Always clean up
      setIsDownloading(null);
      setDownloadProgress(null);
      
      // Clear progress timeout if exists
      if (progressTimeout) {
        clearTimeout(progressTimeout);
        setProgressTimeout(null);
      }
    }
  };

  const handleCopyLink = async () => {
    const success = await sharingService.copyShareableLink(resumeData);
    if (success) {
      toast({
        title: "Link Copied",
        description: "Resume link has been copied to your clipboard.",
      });
    } else {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailShare = () => {
    sharingService.openEmailClient(resumeData, "I've attached my resume for your review.");
    toast({
      title: "Email Client Opened",
      description: "Your email client has been opened with pre-filled content.",
    });
  };

  const handleNativeShare = async () => {
    const success = await sharingService.shareWithNativeAPI(resumeData);
    if (!success) {
      toast({
        title: "Native Share Not Available",
        description: "Please use the individual sharing buttons below.",
        variant: "destructive",
      });
    }
  };
  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF Document',
      description: 'Perfect for job applications and ATS systems',
      icon: FileText,
      features: ['ATS-friendly', 'Professional format', 'Universal compatibility'],
      recommended: true,
      size: '~300KB'
    },
    {
      id: 'word',
      name: 'Word Document',
      description: 'Editable format for future modifications',
      icon: File,
      features: ['Fully editable', 'Easy to customize', 'Employer preferred'],
      recommended: false,
      size: '~250KB'
    },
    {
      id: 'png',
      name: 'Image Preview',
      description: 'High-quality image for portfolios and sharing',
      icon: Image,
      features: ['Visual preview', 'Social sharing', 'Portfolio ready'],
      recommended: false,
      size: '~500KB'
    }
  ];

  const shareableContent = {
    title: `${resumeData.personalInfo.fullName || 'Professional'}'s Resume`,
    description: `Professional resume created with TalentScape AI for ${resumeData.personalInfo.targetRole || 'career opportunities'}.`,
    url: window.location.origin
  };

  const sharingOptions = [
    {
      id: 'link',
      name: 'Copy Shareable Link',
      description: 'Create a link to share your resume online',
      icon: Copy,
      action: handleCopyLink
    },
    {
      id: 'email',
      name: 'Email Resume',
      description: 'Send directly to employers via email',
      icon: Mail,
      action: handleEmailShare
    },
    {
      id: 'native',
      name: 'Share via Device',
      description: 'Use your device\'s built-in sharing options',
      icon: Share2,
      action: handleNativeShare
    }
  ];

  const quickTips = [
    "Save multiple versions for different job types",
    "Include keywords from the job description",
    "Keep file names professional (FirstName_LastName_Resume.pdf)",
    "Always review the final format before sending",
    "Consider having both PDF and Word versions ready"
  ];

  // Debug: Log component render
  console.log('🔧 [DEBUG] ExportOptions component rendering...', { resumeData, resumeElementId });
  
  return (
    <div className="space-y-6">
      {/* Debug indicator */}
      <div className="bg-yellow-100 border-yellow-400 border rounded p-2 text-sm">
        🔧 DEBUG: ExportOptions component loaded - Resume: {resumeData.personalInfo.fullName}
      </div>
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Export Your Resume
        </h2>
        <p className="text-muted-foreground">
          Choose the perfect format for your job applications
        </p>
      </div>

      {/* Preview Readiness Indicator */}
      <PreviewReadinessIndicator 
        elementId={resumeElementId || 'resume-preview-element'}
        showDetails={true}
        onStatusChange={(isReady) => {
          if (!isReady) {
            console.log('Preview not ready - downloads may fail');
          }
        }}
      />

      {/* Export Formats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {exportFormats.map((format) => {
          const Icon = format.icon;
          return (
            <Card 
              key={format.id} 
              className={`cursor-pointer transition-all hover:shadow-medium ${
                format.recommended ? 'ring-2 ring-primary shadow-soft' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  {format.recommended && (
                    <Badge className="bg-gradient-primary text-white">
                      Recommended
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{format.name}</CardTitle>
                <CardDescription>{format.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {format.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Estimated size: {format.size}
                  </div>
                  
                  {isDownloading === format.id ? (
                    <div className="space-y-2">
                      <Button 
                        onClick={() => {
                          // Cancel download
                          setIsDownloading(null);
                          setDownloadProgress(null);
                          if (progressTimeout) {
                            clearTimeout(progressTimeout);
                            setProgressTimeout(null);
                          }
                          toast({
                            title: "Download Cancelled",
                            description: "The download has been cancelled.",
                            variant: "destructive"
                          });
                        }}
                        className="w-full gap-2 bg-red-600 hover:bg-red-700"
                        variant="destructive"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cancel Download
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleDownload(format.id as 'pdf' | 'word' | 'png')}
                      className={`w-full gap-2 ${
                        format.recommended 
                          ? 'bg-gradient-primary hover:bg-primary-hover' 
                          : ''
                      }`}
                      variant={format.recommended ? 'default' : 'outline'}
                      disabled={isDownloading !== null}
                    >
                      <Download className="h-4 w-4" />
                      Download {format.name}
                    </Button>
                  )}
                  
                  {/* Progress indicator */}
                  {isDownloading === format.id && downloadProgress && (
                    <div className="mt-2 space-y-2">
                      <Progress value={downloadProgress.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {downloadProgress.stage === 'retrying' ? (
                          <span className="text-orange-600">
                            {downloadProgress.message} 
                            {downloadProgress.attempt && downloadProgress.maxAttempts && 
                              ` (${downloadProgress.attempt}/${downloadProgress.maxAttempts})`
                            }
                          </span>
                        ) : downloadProgress.stage === 'detecting' ? (
                          <span className="text-blue-600">
                            🔍 {downloadProgress.message}
                          </span>
                        ) : downloadProgress.stage === 'loading' ? (
                          <span className="text-purple-600">
                            ⏳ {downloadProgress.message}
                            {downloadProgress.substage && ` (${downloadProgress.substage})`}
                          </span>
                        ) : downloadProgress.stage === 'generating' ? (
                          <span className="text-green-600">
                            ⚡ {downloadProgress.message}
                            {downloadProgress.substage && ` (${downloadProgress.substage})`}
                          </span>
                        ) : downloadProgress.stage === 'preparing' ? (
                          <span className="text-blue-500">
                            📋 {downloadProgress.message}
                          </span>
                        ) : downloadProgress.stage === 'downloading' ? (
                          <span className="text-indigo-600">
                            ⬇️ {downloadProgress.message}
                          </span>
                        ) : downloadProgress.stage === 'complete' ? (
                          <span className="text-green-600">
                            ✅ {downloadProgress.message}
                          </span>
                        ) : downloadProgress.stage === 'error' ? (
                          <span className="text-red-600">
                            ❌ {downloadProgress.message}
                          </span>
                        ) : (
                          downloadProgress.message
                        )}
                      </p>
                    </div>
                  )}

                  {/* Retry and Manual options for failed downloads */}
                  {!isDownloading && failedDownloads.has(format.id) && (
                    <div className="mt-2 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(format.id as 'pdf' | 'word' | 'png')}
                        className="w-full gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <Loader2 className="h-4 w-4" />
                        Retry Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowManualFallback({format: format.id as 'pdf' | 'word' | 'png'})}
                        className="w-full gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Download className="h-4 w-4" />
                        Manual Download Options
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sharing Options */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Sharing Options
          </CardTitle>
          <CardDescription>
            Share your resume on social media or via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Share Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sharingOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.id}
                  variant="outline"
                  onClick={option.action}
                  className="h-auto p-4 justify-start gap-3"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{option.name}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Social Media Sharing */}
          <div>
            <h4 className="font-semibold mb-3">Share on Social Media</h4>
            <div className="flex flex-wrap gap-3">
              <LinkedinShareButton
                url={shareableContent.url}
                title={shareableContent.title}
                summary={shareableContent.description}
                source="TalentScape AI"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Linkedin className="h-4 w-4 text-blue-600" />
                  LinkedIn
                </Button>
              </LinkedinShareButton>

              <TwitterShareButton
                url={shareableContent.url}
                title={shareableContent.description}
                hashtags={['resume', 'career', 'jobs']}
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Twitter className="h-4 w-4 text-blue-400" />
                  Twitter
                </Button>
              </TwitterShareButton>

              <FacebookShareButton
                url={shareableContent.url}
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Facebook className="h-4 w-4 text-blue-700" />
                  Facebook
                </Button>
              </FacebookShareButton>

              <WhatsappShareButton
                url={shareableContent.url}
                title={shareableContent.description}
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  WhatsApp
                </Button>
              </WhatsappShareButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Pro Tips for Resume Submission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Download All */}
      <div className="text-center">
        <Button 
          size="lg"
          className="gap-2 bg-gradient-primary hover:bg-primary-hover px-8"
          onClick={async () => {
            const formats: ('pdf' | 'word' | 'png')[] = ['pdf', 'word', 'png'];
            let successCount = 0;
            let failureCount = 0;

            toast({
              title: "Batch Download Started",
              description: "Starting downloads for all formats...",
            });

            // Download all formats sequentially with small delays
            for (const format of formats) {
              try {
                await handleDownload(format);
                successCount++;
                // Small delay between downloads to prevent browser blocking
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (error) {
                failureCount++;
                console.error(`Failed to download ${format}:`, error);
              }
            }

            // Show final result
            if (successCount === formats.length) {
              toast({
                title: "All Downloads Complete! 🎉",
                description: `Successfully downloaded ${successCount} files (PDF, Word, and PNG). Check your downloads folder.`,
                duration: 6000,
              });
            } else if (successCount > 0) {
              toast({
                title: "Partial Download Success",
                description: `Downloaded ${successCount} out of ${formats.length} formats successfully. ${failureCount} failed.`,
                variant: "destructive",
                duration: 8000,
              });
            } else {
              toast({
                title: "All Downloads Failed",
                description: "All download attempts failed. Please try individual downloads or check your browser settings.",
                variant: "destructive",
                duration: 10000,
              });
            }
          }}
          disabled={isDownloading !== null}
        >
          {isDownloading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5" />
          )}
          {isDownloading ? 'Downloading...' : 'Download All Formats'}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Get PDF, Word, and PNG versions at once
        </p>
      </div>

      {/* Debug Panel Toggle */}
      <div className="text-center mt-8 space-y-2">
        <div className="flex gap-2 justify-center flex-wrap">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAdvancedDiagnostics(true)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Bug className="h-4 w-4" />
            Run Diagnostics
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowTestSuite(true)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Download className="h-4 w-4" />
            Test Downloads
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDebugPanel(true)}
            className="gap-1 text-xs text-muted-foreground/70 hover:text-muted-foreground"
          >
            Basic troubleshooting
          </Button>
          
          {/* Emergency test download - bypass all complex logic */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={async () => {
              console.log('🚨 [EMERGENCY] Starting emergency test download...');
              try {
                setIsDownloading('pdf');
                const service = new RobustDownloadService((progress: RobustDownloadProgress) => {
                  console.log('📊 [EMERGENCY PROGRESS]', progress);
                  setDownloadProgress(progress);
                });
                
                console.log('🚨 [EMERGENCY] Calling downloadAsPDF directly...');
                await service.downloadAsPDF(resumeData, resumeElementId || 'resume-preview-element');
                console.log('🚨 [EMERGENCY] Direct call completed!');
                
                toast({
                  title: 'Emergency Test Complete',
                  description: 'Direct download attempt finished - check console for details'
                });
              } catch (error) {
                console.error('🚨 [EMERGENCY ERROR]', error);
                toast({
                  title: 'Emergency Test Failed',
                  description: `Error: ${error instanceof Error ? error.message : String(error)}`,
                  variant: 'destructive'
                });
              } finally {
                setIsDownloading(null);
                setDownloadProgress(null);
              }
            }}
            className="gap-1 text-xs text-red-600/70 hover:text-red-600"
          >
            🚨 Emergency Test
          </Button>
        </div>
      </div>

      {/* Advanced Diagnostics */}
      <AdvancedDownloadDiagnostics
        isVisible={showAdvancedDiagnostics}
        onClose={() => setShowAdvancedDiagnostics(false)}
        elementId={resumeElementId || 'resume-preview-element'}
        onRetryDownload={(format) => {
          setShowAdvancedDiagnostics(false);
          handleDownload(format);
        }}
      />

      {/* Test Suite */}
      <DownloadTestSuite
        isVisible={showTestSuite}
        onClose={() => setShowTestSuite(false)}
        resumeData={resumeData}
        resumeElementId={resumeElementId || 'resume-preview-element'}
      />

      {/* Debug Panel */}
      <DownloadDebugPanel 
        isVisible={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />

      {/* Manual Download Fallback */}
      {showManualFallback && (
        <ManualDownloadFallback
          resumeElementId={resumeElementId || 'resume-preview-element'}
          resumeData={resumeData}
          format={showManualFallback.format}
          onClose={() => setShowManualFallback(null)}
          onRetryAutomated={() => {
            setShowManualFallback(null);
            handleDownload(showManualFallback.format);
          }}
        />
      )}
    </div>
  );
};