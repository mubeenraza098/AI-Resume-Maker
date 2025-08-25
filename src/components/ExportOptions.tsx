import React, { useState } from 'react';
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
import { DownloadService, DownloadProgress } from '@/lib/downloadService';
import { ImprovedDownloadService } from '@/lib/improvedDownloadService';
import { SharingService } from '@/lib/sharingService';
import { DownloadDebugPanel } from './DownloadDebugPanel';
import { ManualDownloadFallback } from './ManualDownloadFallback';
import { PreviewReadinessIndicator } from './PreviewReadinessIndicator';

interface ExportOptionsProps {
  onExport?: (format: 'pdf' | 'word' | 'png') => void;
  resumeData: any;
  resumeElementId?: string;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ 
  onExport, 
  resumeData, 
  resumeElementId = 'resume-preview' 
}) => {
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [failedDownloads, setFailedDownloads] = useState<Set<string>>(new Set());
  const [showManualFallback, setShowManualFallback] = useState<{format: 'pdf' | 'word' | 'png'} | null>(null);
  const { toast } = useToast();
  
  // Use improved download service for better reliability
  const downloadService = new ImprovedDownloadService((progress) => {
    setDownloadProgress(progress);
  });
  
  // Keep fallback to original service
  const fallbackDownloadService = new DownloadService((progress) => {
    setDownloadProgress(progress);
  });
  
  const sharingService = new SharingService();

  const handleDownload = async (format: 'pdf' | 'word' | 'png', useImproved = true) => {
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

      const service = useImproved ? downloadService : fallbackDownloadService;
      
      await new Promise<void>(async (resolve, reject) => {
        try {
          switch (format) {
            case 'pdf':
              await service.downloadAsPDF(resumeData, resumeElementId || 'resume-preview-element');
              break;
            case 'word':
              await service.downloadAsWord(resumeData);
              break;
            case 'png':
              const fileName = `${(resumeData.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.png`;
              await service.downloadAsPNG(resumeElementId || 'resume-preview-element', fileName);
              break;
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      // Show success toast with longer duration
      toast({
        title: "Download Complete! 📄",
        description: `Your resume has been successfully downloaded as ${format.toUpperCase()}. Check your downloads folder.`,
        duration: 5000,
      });

      // Call the original onExport if provided
      onExport?.(format);

    } catch (error) {
      console.error('Download error:', error);
      
      // Mark as failed
      setFailedDownloads(prev => new Set(prev).add(format));
      
      // Show detailed error toast with retry options
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const isElementError = errorMessage.includes('not found') || errorMessage.includes('Element');
      
      toast({
        title: "Download Failed ❌",
        description: isElementError 
          ? `Cannot find resume on page. Please make sure you're on the preview step and try again.`
          : `Failed to download ${format.toUpperCase()}: ${errorMessage}`,
        variant: "destructive",
        duration: 10000,
      });

      // If using improved service failed, don't auto-retry with fallback to avoid infinite loops
      if (useImproved && isElementError) {
        console.log('Improved download failed with element error - not attempting fallback to avoid loops');
      }

    } finally {
      setIsDownloading(null);
      setDownloadProgress(null);
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

  return (
    <div className="space-y-6">
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
                  
                  <Button 
                    onClick={() => handleDownload(format.id as 'pdf' | 'word' | 'png')}
                    className={`w-full gap-2 ${
                      format.recommended 
                        ? 'bg-gradient-primary hover:bg-primary-hover' 
                        : ''
                    }`}
                    variant={format.recommended ? 'default' : 'outline'}
                    disabled={isDownloading === format.id}
                  >
                    {isDownloading === format.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isDownloading === format.id ? 'Downloading...' : `Download ${format.name}`}
                  </Button>
                  
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
                quote={shareableContent.description}
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

            for (const format of formats) {
              try {
                await handleDownload(format);
                successCount++;
                // Small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 1000));
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
      <div className="text-center mt-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowDebugPanel(true)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Bug className="h-4 w-4" />
          Download not working? Click here for help
        </Button>
      </div>

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