import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Copy, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  ExternalLink,
  Printer
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ManualDownloadFallbackProps {
  resumeElementId: string;
  resumeData: any;
  format: 'pdf' | 'word' | 'png';
  onClose: () => void;
  onRetryAutomated: () => void;
}

export const ManualDownloadFallback: React.FC<ManualDownloadFallbackProps> = ({
  resumeElementId,
  resumeData,
  format,
  onClose,
  onRetryAutomated
}) => {
  const [isGeneratingDataUrl, setIsGeneratingDataUrl] = useState(false);
  const { toast } = useToast();

  const generateManualDownloadOptions = async () => {
    setIsGeneratingDataUrl(true);
    try {
      const element = document.getElementById(resumeElementId);
      if (!element) {
        throw new Error('Resume element not found');
      }

      // Try to generate a data URL that users can manually save
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Simple fallback - create a basic representation
        canvas.width = 800;
        canvas.height = 1000;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText('Resume Export', 50, 50);
        ctx.fillText('Please use manual methods below', 50, 80);
        
        const dataUrl = canvas.toDataURL('image/png');
        
        // Open in new window
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>Resume - Manual Download</title></head>
              <body>
                <h2>Resume Download</h2>
                <p>Right-click the image below and select "Save image as..." to download.</p>
                <img src="${dataUrl}" style="max-width: 100%; border: 1px solid #ccc;" />
                <br><br>
                <button onclick="window.print()">Print this page</button>
              </body>
            </html>
          `);
        }
      }
      
      toast({
        title: "Manual Download Ready",
        description: "A new window has opened. Right-click and save the image.",
      });
      
    } catch (error) {
      toast({
        title: "Manual Generation Failed",
        description: "Please try the alternative methods below.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDataUrl(false);
    }
  };

  const copyResumeText = () => {
    // Generate text version of resume
    const textResume = `
${resumeData.personalInfo.fullName || 'Name'}
${resumeData.personalInfo.email || ''} | ${resumeData.personalInfo.phone || ''}
${resumeData.personalInfo.linkedIn || ''} ${resumeData.personalInfo.github || ''}

OBJECTIVE
${resumeData.personalInfo.objective || 'Not specified'}

SKILLS
${resumeData.skills.join(', ') || 'Not specified'}

EXPERIENCE
${resumeData.experience.map((exp: any) => `
${exp.role} - ${exp.company}
${exp.duration}
${exp.achievements.map((achievement: string) => `• ${achievement}`).join('\n')}
`).join('\n')}

EDUCATION
${resumeData.education.map((edu: any) => `${edu.degree} - ${edu.institution} (${edu.year})`).join('\n')}

CERTIFICATIONS
${resumeData.certifications.map((cert: any) => `${cert.name} - ${cert.issuer} (${cert.year})`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(textResume).then(() => {
      toast({
        title: "Resume Text Copied",
        description: "You can now paste this into any document editor.",
      });
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textResume;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Resume Text Copied",
        description: "You can now paste this into any document editor.",
      });
    });
  };

  const openPrintDialog = () => {
    const element = document.getElementById(resumeElementId);
    if (element) {
      // Create a new window with just the resume content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Resume - ${resumeData.personalInfo.fullName}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${element.outerHTML}
              <div class="no-print" style="margin-top: 20px;">
                <button onclick="window.print()">Print</button>
                <button onclick="window.close()">Close</button>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const troubleshootingSteps = [
    "Ensure you're on the resume preview page",
    "Try refreshing the page and waiting for it to fully load",
    "Disable browser extensions temporarily",
    "Check if popup blockers are preventing downloads",
    "Try using a different browser (Chrome, Firefox, Safari)",
    "Clear browser cache and cookies, then try again"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <CardTitle>Manual Download Required</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          <CardDescription>
            Automatic {format.toUpperCase()} download failed. Here are alternative methods to save your resume.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Retry Automatic */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Try Automatic Download Again
            </h3>
            <Button 
              onClick={onRetryAutomated}
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              Retry Automatic Download
            </Button>
          </div>

          {/* Manual Methods */}
          <div>
            <h3 className="font-semibold mb-3">Manual Download Methods</h3>
            <div className="space-y-3">
              
              {/* Browser Print */}
              <Alert>
                <Printer className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Print to PDF:</strong> Use your browser's print function and select "Save as PDF"
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={openPrintDialog}
                      className="gap-1"
                    >
                      <Printer className="h-3 w-3" />
                      Print
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Copy Text */}
              <Alert>
                <Copy className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Copy as Text:</strong> Get a text version to paste into any document editor
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={copyResumeText}
                      className="gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Screenshot */}
              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  <strong>Take Screenshot:</strong> Use your device's screenshot feature to capture the resume, 
                  then crop and save the image
                </AlertDescription>
              </Alert>

              {/* Manual Data URL Generation */}
              {format === 'png' && (
                <Alert>
                  <ExternalLink className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>Generate Image:</strong> Create a basic image version in a new window
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={generateManualDownloadOptions}
                        disabled={isGeneratingDataUrl}
                        className="gap-1"
                      >
                        {isGeneratingDataUrl ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
                        ) : (
                          <ExternalLink className="h-3 w-3" />
                        )}
                        Generate
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Troubleshooting */}
          <div>
            <h3 className="font-semibold mb-3">Troubleshooting Steps</h3>
            <div className="space-y-2">
              {troubleshootingSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-primary font-medium">{index + 1}</span>
                  </div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Browser Compatibility Note */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Browser Issues?</strong> Some corporate networks or older browsers may block downloads. 
              Try using a personal device or different network if possible.
            </AlertDescription>
          </Alert>

        </CardContent>
      </Card>
    </div>
  );
};