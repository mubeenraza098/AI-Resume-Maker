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
  Bug,
  X,
  RotateCcw,
  Sparkles,
  Star
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
      
      // Use element ID for download
      const elementId = resumeElementId || 'resume-preview-element';
      
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

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Modern Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Download className="h-4 w-4" />
            Ready for Export
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Export Your Resume
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your preferred format and download instantly. No waiting, no loading screens.
          </p>
        </div>

        {/* Modern Export Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {exportFormats.map((format) => {
            const Icon = format.icon;
            const isActive = isDownloading === format.id;
            const hasFailed = failedDownloads.has(format.id);
            
            return (
              <div 
                key={format.id} 
                className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${
                  format.recommended 
                    ? 'border-blue-200 hover:border-blue-300' 
                    : 'border-gray-100 hover:border-gray-200'
                } ${isActive ? 'ring-4 ring-blue-100 scale-105' : 'hover:scale-105'}`}
              >
                {/* Recommended Badge */}
                {format.recommended && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    ⭐ RECOMMENDED
                  </div>
                )}

                {/* Icon and Title */}
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 ${
                    format.recommended 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-600'
                  }`}>
                    <Icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{format.name}</h3>
                  <p className="text-gray-600">{format.description}</p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {format.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Size Info */}
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                    📁 {format.size}
                  </span>
                </div>

                {/* Action Button */}
                {isActive ? (
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    {downloadProgress && (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${downloadProgress.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-center text-gray-600">
                          {downloadProgress.message}
                        </p>
                      </div>
                    )}
                    
                    {/* Cancel Button */}
                    <Button 
                      onClick={() => {
                        setIsDownloading(null);
                        setDownloadProgress(null);
                        if (progressTimeout) {
                          clearTimeout(progressTimeout);
                          setProgressTimeout(null);
                        }
                        toast({
                          title: "Download Cancelled",
                          description: "The download has been cancelled.",
                        });
                      }}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Download
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Main Download Button */}
                    <Button 
                      onClick={() => handleDownload(format.id as 'pdf' | 'word' | 'png')}
                      className={`w-full font-semibold py-4 rounded-xl transition-all duration-200 ${
                        format.recommended 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl' 
                          : 'bg-gray-800 hover:bg-gray-900 text-white'
                      }`}
                      disabled={isDownloading !== null}
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download {format.name}
                    </Button>
                    
                    {/* Retry Button for Failed Downloads */}
                    {hasFailed && (
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(format.id as 'pdf' | 'word' | 'png')}
                        className="w-full border-2 border-orange-300 text-orange-600 hover:bg-orange-50 font-medium py-2 rounded-xl"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retry Download
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modern Sharing Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Share2 className="h-4 w-4" />
              Share & Connect
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Share Your Success</h2>
            <p className="text-gray-600">Let the world know about your professional achievements</p>
          </div>

          {/* Quick Share Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {sharingOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={option.action}
                  className="group p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 text-left"
                >
                  <Icon className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-gray-800 mb-1">{option.name}</h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </button>
              );
            })}
          </div>

          {/* Social Media Buttons */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Share on Social Media</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <LinkedinShareButton
                url={shareableContent.url}
                title={shareableContent.title}
                summary={shareableContent.description}
                source="TalentScape AI"
              >
                <div className="flex items-center gap-2 bg-[#0077b5] text-white px-4 py-2 rounded-lg hover:bg-[#005885] transition-colors cursor-pointer">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </div>
              </LinkedinShareButton>

              <TwitterShareButton
                url={shareableContent.url}
                title={shareableContent.description}
                hashtags={['resume', 'career', 'jobs']}
              >
                <div className="flex items-center gap-2 bg-[#1da1f2] text-white px-4 py-2 rounded-lg hover:bg-[#0c85d0] transition-colors cursor-pointer">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </div>
              </TwitterShareButton>

              <FacebookShareButton
                url={shareableContent.url}
              >
                <div className="flex items-center gap-2 bg-[#4267b2] text-white px-4 py-2 rounded-lg hover:bg-[#365899] transition-colors cursor-pointer">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </div>
              </FacebookShareButton>

              <WhatsappShareButton
                url={shareableContent.url}
                title={shareableContent.description}
              >
                <div className="flex items-center gap-2 bg-[#25d366] text-white px-4 py-2 rounded-lg hover:bg-[#20ba5a] transition-colors cursor-pointer">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </div>
              </WhatsappShareButton>
            </div>
          </div>
        </div>

        {/* Pro Tips Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              Pro Tips
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Resume Success Tips</h2>
            <p className="text-gray-600">Make your resume stand out from the crowd</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <span className="text-gray-700 font-medium">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Download All Section */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Get All Formats</h2>
            <p className="text-gray-600">Download PDF, Word, and PNG versions in one click</p>
          </div>
          
          <Button 
            size="lg"
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 mb-4"
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
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-6 w-6 mr-2" />
            )}
            {isDownloading ? 'Downloading...' : 'Download All Formats'}
          </Button>
          
          <p className="text-sm text-gray-500">
            📁 Get PDF, Word, and PNG versions instantly
          </p>
        </div>
        
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
    </div>
  );
};