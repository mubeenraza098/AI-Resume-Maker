import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { ResumeData } from '../components/ResumeBuilder';
import { DownloadDebugger } from './downloadDebugger';

export interface DownloadProgress {
  stage: 'preparing' | 'generating' | 'downloading' | 'complete' | 'error';
  progress: number;
  message: string;
}

export class DownloadService {
  private onProgress?: (progress: DownloadProgress) => void;

  constructor(onProgress?: (progress: DownloadProgress) => void) {
    this.onProgress = onProgress;
  }

  private updateProgress(progress: DownloadProgress) {
    this.onProgress?.(progress);
  }

  private async waitForElement(elementId: string, timeout = 5000): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      const element = document.getElementById(elementId);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.getElementById(elementId);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element with ID "${elementId}" not found within ${timeout}ms`));
      }, timeout);
    });
  }

  private createDownloadLink(blob: Blob, fileName: string): void {
    try {
      // Method 1: Use file-saver (preferred)
      saveAs(blob, fileName);
    } catch (error) {
      console.warn('FileSaver failed, trying fallback method:', error);
      
      // Method 2: Manual download using URL.createObjectURL
      try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (fallbackError) {
        console.error('All download methods failed:', fallbackError);
        throw new Error('Unable to download file. Please check your browser settings.');
      }
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9.\-_]/gi, '_');
  }

  async downloadAsPDF(resumeData: ResumeData, resumeElementId: string): Promise<void> {
    // Log download attempt for debugging
    DownloadDebugger.logDownloadAttempt('pdf', resumeElementId);
    
    try {
      this.updateProgress({
        stage: 'preparing',
        progress: 10,
        message: 'Preparing resume for PDF generation...'
      });

      // Wait for element to be available
      const element = await this.waitForElement(resumeElementId);

      this.updateProgress({
        stage: 'generating',
        progress: 30,
        message: 'Capturing resume content...'
      });

      // Ensure element is visible and has content
      if (element.offsetWidth === 0 || element.offsetHeight === 0) {
        throw new Error('Resume element is not visible or has no content');
      }

      // Scroll to element and wait a bit for any lazy-loaded content
      element.scrollIntoView();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create canvas with improved settings
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        removeContainer: false,
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
        windowWidth: element.offsetWidth,
        windowHeight: element.offsetHeight
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to capture resume content');
      }

      this.updateProgress({
        stage: 'generating',
        progress: 60,
        message: 'Generating PDF document...'
      });

      // Create PDF with improved settings
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const aspectRatio = canvas.width / canvas.height;
      
      let imgWidth, imgHeight;
      if (aspectRatio > (pdfWidth / pdfHeight)) {
        imgWidth = pdfWidth;
        imgHeight = pdfWidth / aspectRatio;
      } else {
        imgHeight = pdfHeight;
        imgWidth = pdfHeight * aspectRatio;
      }

      const xOffset = (pdfWidth - imgWidth) / 2;
      const yOffset = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');

      this.updateProgress({
        stage: 'downloading',
        progress: 90,
        message: 'Downloading PDF...'
      });

      // Generate safe filename
      const baseName = this.sanitizeFilename(resumeData.personalInfo.fullName || 'Resume');
      const fileName = `${baseName}_Resume.pdf`;

      // Use the improved download method
      const pdfBlob = pdf.output('blob');
      this.createDownloadLink(pdfBlob, fileName);

      // Log success
      DownloadDebugger.logDownloadSuccess('pdf', fileName);

      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: 'PDF downloaded successfully!'
      });

    } catch (error) {
      // Log error for debugging
      DownloadDebugger.logDownloadError('pdf', error);
      
      console.error('PDF generation failed:', error);
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  async downloadAsWord(resumeData: ResumeData): Promise<void> {
    // Log download attempt for debugging
    DownloadDebugger.logDownloadAttempt('word', 'word-document');
    
    try {
      this.updateProgress({
        stage: 'preparing',
        progress: 10,
        message: 'Preparing resume for Word document...'
      });

      // Validate resume data
      if (!resumeData.personalInfo.fullName) {
        throw new Error('Resume data is incomplete');
      }

      this.updateProgress({
        stage: 'generating',
        progress: 50,
        message: 'Creating Word document...'
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Header with name
            new Paragraph({
              children: [
                new TextRun({
                  text: resumeData.personalInfo.fullName,
                  bold: true,
                  size: 32,
                  color: '2563eb'
                })
              ],
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER
            }),

            // Contact Information
            new Paragraph({
              children: [
                new TextRun({
                  text: [
                    resumeData.personalInfo.email,
                    resumeData.personalInfo.phone
                  ].filter(Boolean).join(' | '),
                  size: 22
                })
              ],
              alignment: AlignmentType.CENTER
            }),

            ...(resumeData.personalInfo.linkedIn || resumeData.personalInfo.github ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: [
                      resumeData.personalInfo.linkedIn,
                      resumeData.personalInfo.github
                    ].filter(Boolean).join(' | '),
                    size: 22
                  })
                ],
                alignment: AlignmentType.CENTER
              })
            ] : []),

            // Objective
            ...(resumeData.personalInfo.objective ? [
              new Paragraph({ text: '' }), // Space
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'OBJECTIVE',
                    bold: true,
                    size: 24,
                    color: '2563eb'
                  })
                ],
                heading: HeadingLevel.HEADING_2
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: resumeData.personalInfo.objective,
                    size: 22
                  })
                ]
              })
            ] : []),

            // Experience
            ...(resumeData.experience.length > 0 ? [
              new Paragraph({ text: '' }), // Space
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'PROFESSIONAL EXPERIENCE',
                    bold: true,
                    size: 24,
                    color: '2563eb'
                  })
                ],
                heading: HeadingLevel.HEADING_2
              }),
              ...resumeData.experience.flatMap(exp => [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: exp.role,
                      bold: true,
                      size: 22
                    }),
                    new TextRun({
                      text: ` - ${exp.company}`,
                      size: 22
                    })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: exp.duration,
                      italics: true,
                      size: 20
                    })
                  ]
                }),
                ...exp.achievements.map(achievement => 
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `• ${achievement}`,
                        size: 20
                      })
                    ]
                  })
                ),
                new Paragraph({ text: '' }) // Space between experiences
              ])
            ] : []),

            // Skills
            ...(resumeData.skills.length > 0 ? [
              new Paragraph({ text: '' }), // Space
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'SKILLS',
                    bold: true,
                    size: 24,
                    color: '2563eb'
                  })
                ],
                heading: HeadingLevel.HEADING_2
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: resumeData.skills.join(' • '),
                    size: 22
                  })
                ]
              })
            ] : []),

            // Education
            ...(resumeData.education.length > 0 ? [
              new Paragraph({ text: '' }), // Space
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'EDUCATION',
                    bold: true,
                    size: 24,
                    color: '2563eb'
                  })
                ],
                heading: HeadingLevel.HEADING_2
              }),
              ...resumeData.education.map(edu => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${edu.degree} - ${edu.institution} (${edu.year})`,
                      size: 22
                    })
                  ]
                })
              )
            ] : []),

            // Certifications
            ...(resumeData.certifications.length > 0 ? [
              new Paragraph({ text: '' }), // Space
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'CERTIFICATIONS',
                    bold: true,
                    size: 24,
                    color: '2563eb'
                  })
                ],
                heading: HeadingLevel.HEADING_2
              }),
              ...resumeData.certifications.map(cert => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${cert.name} - ${cert.issuer} (${cert.year})`,
                      size: 22
                    })
                  ]
                })
              )
            ] : [])
          ]
        }]
      });

      this.updateProgress({
        stage: 'downloading',
        progress: 90,
        message: 'Downloading Word document...'
      });

      const buffer = await Packer.toBuffer(doc);
      const baseName = this.sanitizeFilename(resumeData.personalInfo.fullName);
      const fileName = `${baseName}_Resume.docx`;
      
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });

      this.createDownloadLink(blob, fileName);

      // Log success
      DownloadDebugger.logDownloadSuccess('word', fileName);

      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: 'Word document downloaded successfully!'
      });

    } catch (error) {
      // Log error for debugging
      DownloadDebugger.logDownloadError('word', error);
      
      console.error('Word generation failed:', error);
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: `Failed to generate Word document: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  async downloadAsPNG(resumeElementId: string, fileName: string): Promise<void> {
    // Log download attempt for debugging
    DownloadDebugger.logDownloadAttempt('png', resumeElementId);
    
    try {
      this.updateProgress({
        stage: 'preparing',
        progress: 10,
        message: 'Preparing resume for image capture...'
      });

      // Wait for element to be available
      const element = await this.waitForElement(resumeElementId);

      this.updateProgress({
        stage: 'generating',
        progress: 50,
        message: 'Capturing resume as image...'
      });

      // Ensure element is visible
      if (element.offsetWidth === 0 || element.offsetHeight === 0) {
        throw new Error('Resume element is not visible or has no content');
      }

      // Scroll to element and wait for rendering
      element.scrollIntoView();
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 3, // Higher quality for images
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        removeContainer: false,
        logging: false
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to capture resume content');
      }

      this.updateProgress({
        stage: 'downloading',
        progress: 90,
        message: 'Downloading image...'
      });

      // Convert to blob and download
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to generate image blob'));
            return;
          }

          try {
            const safeFileName = this.sanitizeFilename(fileName);
            this.createDownloadLink(blob, safeFileName);
            
            // Log success
            DownloadDebugger.logDownloadSuccess('png', safeFileName);
            
            this.updateProgress({
              stage: 'complete',
              progress: 100,
              message: 'Image downloaded successfully!'
            });
            
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 'image/png', 1.0);
      });

    } catch (error) {
      // Log error for debugging
      DownloadDebugger.logDownloadError('png', error);
      
      console.error('PNG generation failed:', error);
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  // Fallback method for unsupported browsers
  async downloadWithFallback(format: 'pdf' | 'word' | 'png', resumeData: ResumeData, resumeElementId: string): Promise<void> {
    try {
      // Check for basic browser support
      if (!document.createElement('canvas').getContext) {
        throw new Error('Your browser does not support file downloads');
      }

      switch (format) {
        case 'pdf':
          await this.downloadAsPDF(resumeData, resumeElementId);
          break;
        case 'word':
          await this.downloadAsWord(resumeData);
          break;
        case 'png':
          const fileName = `${this.sanitizeFilename(resumeData.personalInfo.fullName || 'Resume')}_Resume.png`;
          await this.downloadAsPNG(resumeElementId, fileName);
          break;
      }
    } catch (error) {
      // Enhanced error reporting
      console.error('Download failed:', error);
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: 'Download failed. Please try a different browser or contact support for assistance.'
      });
      throw error;
    }
  }
}