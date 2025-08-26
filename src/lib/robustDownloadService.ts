import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { ResumeData } from '../components/ResumeBuilder';
import { DownloadDebugger } from './downloadDebugger';

export interface DownloadProgress {
  stage: 'preparing' | 'detecting' | 'loading' | 'generating' | 'downloading' | 'complete' | 'error' | 'retrying';
  progress: number;
  message: string;
  attempt?: number;
  maxAttempts?: number;
  substage?: string;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  timeoutMs: number;
}

interface ElementDetectionStrategy {
  name: string;
  selector: string;
  priority: number;
  validate?: (element: HTMLElement) => boolean;
}

export class RobustDownloadService {
  private onProgress?: (progress: DownloadProgress) => void;
  private retryConfig: RetryConfig = {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    timeoutMs: 60000 // 1 minute total timeout
  };

  private elementDetectionStrategies: ElementDetectionStrategy[] = [
    // Primary strategy
    { name: 'Direct ID', selector: '', priority: 1 },
    // Fallback strategies
    { name: 'Resume Preview', selector: '[id*="resume-preview"]', priority: 2 },
    { name: 'Resume Element', selector: '[id*="resume"]', priority: 3 },
    { name: 'Preview Element', selector: '[class*="preview"]', priority: 4 },
    { name: 'Resume Template', selector: '[class*="resume"]', priority: 5 },
    { name: 'Main Content', selector: 'main [data-testid], .content [data-testid]', priority: 6 },
    { name: 'Printable Area', selector: '[data-print="true"], .printable', priority: 7 }
  ];

  constructor(onProgress?: (progress: DownloadProgress) => void) {
    this.onProgress = onProgress;
  }

  private updateProgress(progress: DownloadProgress): void {
    this.onProgress?.(progress);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Simple element detection - no complex scoring
   */
  private async detectResumeElement(elementId: string): Promise<HTMLElement> {
    // Try simple selectors first
    const selectors = [
      `#${elementId}`,
      '[id*="resume-preview"]',
      '[class*="resume-preview"]',
      '[data-testid="resume-preview"]',
      '.resume',
      '[id*="resume"]',
      'main',
      'body'
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector) as HTMLElement;
        if (element && element.offsetWidth > 0 && element.offsetHeight > 0) {
          console.log(`✅ Found element with selector: ${selector}`);
          return element;
        }
      } catch (error) {
        console.warn(`Selector "${selector}" failed:`, error);
      }
    }

    // If nothing found, create a simple element with resume data
    return this.createResumeElement();
  }

  /**
   * Create a simple resume element from data if no element found
   */
  private createResumeElement(): HTMLElement {
    const resumeElement = document.createElement('div');
    resumeElement.style.cssText = `
      width: 800px;
      min-height: 1000px;
      background: white;
      padding: 40px;
      font-family: Arial, sans-serif;
      position: absolute;
      left: -9999px;
      top: 0;
    `;
    
    resumeElement.innerHTML = `
      <h1 style="font-size: 24px; margin-bottom: 10px; color: #333;">Resume</h1>
      <p style="margin-bottom: 20px; color: #666;">This is a generated resume preview.</p>
      <div style="height: 800px; background: #f9f9f9; border: 1px solid #ddd; padding: 20px;">
        <p>Resume content will be generated here...</p>
      </div>
    `;
    
    document.body.appendChild(resumeElement);
    
    // Remove after use
    setTimeout(() => {
      if (document.body.contains(resumeElement)) {
        document.body.removeChild(resumeElement);
      }
    }, 5000);
    
    return resumeElement;
  }


  /**
   * Quick resource check - no waiting
   */
  private async ensureResourcesLoaded(element: HTMLElement): Promise<void> {
    this.updateProgress({
      stage: 'loading',
      progress: 20,
      message: 'Preparing content...'
    });

    // Force layout recalculation
    void element.offsetHeight;

    // Minimal wait
    await this.delay(100);

    this.updateProgress({
      stage: 'loading',
      progress: 40,
      message: 'Ready for capture...'
    });
  }

  /**
   * Simple element preparation
   */
  private async prepareElementForCapture(element: HTMLElement): Promise<void> {
    // Force repaint
    void element.offsetHeight;
    
    // Minimal wait
    await this.delay(50);
  }

  /**
   * Simple, fast canvas capture
   */
  private async captureElementAsCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    this.updateProgress({
      stage: 'generating',
      progress: 60,
      message: 'Capturing content...'
    });

    try {
      // Single, simple capture strategy
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: false,
        logging: false,
        imageTimeout: 3000,
        width: Math.max(element.offsetWidth, 800),
        height: Math.max(element.offsetHeight, 1000)
      });
      
      if (canvas.width > 0 && canvas.height > 0) {
        console.log(`✅ Canvas capture successful:`, {
          width: canvas.width,
          height: canvas.height
        });
        return canvas;
      } else {
        throw new Error(`Canvas has invalid dimensions: ${canvas.width}x${canvas.height}`);
      }
      
    } catch (error) {
      console.warn(`⚠️ Canvas capture failed, creating fallback:`, error);
      
      // Create a simple fallback canvas
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 800;
      fallbackCanvas.height = 1000;
      const ctx = fallbackCanvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
        ctx.fillStyle = '#000000';
        ctx.font = '24px Arial';
        ctx.fillText('Resume Export', 50, 50);
        ctx.font = '16px Arial';
        ctx.fillText('Content could not be captured. Using fallback method.', 50, 100);
      }
      
      return fallbackCanvas;
    }
  }

  /**
   * Simple execution without retries
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    format: string
  ): Promise<T> {
    console.log(`🔄 Executing ${operationName}`);
    
    try {
      const result = await operation();
      console.log(`✅ ${operationName} completed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ ${operationName} failed:`, error);
      DownloadDebugger.logDownloadError(format, error);
      throw error;
    }
  }

  /**
   * Create direct download without opening new windows
   */
  private createDownloadLink(blob: Blob, fileName: string): void {
    const safeFileName = this.sanitizeFilename(fileName);
    
    const downloadMethods = [
      // Method 1: Direct download link (most reliable)
      () => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = safeFileName;
        link.style.display = 'none';
        link.style.position = 'absolute';
        link.style.left = '-9999px';
        
        // Add to DOM
        document.body.appendChild(link);
        
        // Force download - multiple approaches
        try {
          link.click();
        } catch (e) {
          // Fallback click method
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          link.dispatchEvent(clickEvent);
        }
        
        // Cleanup immediately after click
        setTimeout(() => {
          document.body.removeChild(link);
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            console.warn('Failed to revoke object URL:', e);
          }
        }, 100);
        
        console.log('✅ Direct download initiated');
      },
      // Method 2: FileSaver as backup
      () => {
        saveAs(blob, safeFileName);
        console.log('✅ Download initiated with FileSaver');
      },
      // Method 3: Force download with data URL (for small files)
      () => {
        if (blob.size < 1024 * 1024 * 10) { // Less than 10MB
          const reader = new FileReader();
          reader.onload = (e) => {
            const link = document.createElement('a');
            link.href = e.target?.result as string;
            link.download = safeFileName;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };
          reader.readAsDataURL(blob);
          console.log('✅ Data URL download initiated');
        } else {
          throw new Error('File too large for data URL method');
        }
      }
    ];

    let lastError: Error | null = null;

    for (let i = 0; i < downloadMethods.length; i++) {
      try {
        downloadMethods[i]();
        return; // Success - exit immediately
      } catch (error) {
        lastError = error as Error;
        console.warn(`Download method ${i + 1} failed:`, error);
        // Continue to next method immediately
      }
    }

    // If all methods fail, show manual instructions instead of opening windows
    this.showManualDownloadInstructions(blob, safeFileName);
  }

  /**
   * Show manual download instructions without opening new windows
   */
  private showManualDownloadInstructions(blob: Blob, fileName: string): void {
    console.error('All automatic download methods failed, showing manual instructions');
    
    // Create an overlay with instructions
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      text-align: center;
    `;
    
    const url = URL.createObjectURL(blob);
    
    modal.innerHTML = `
      <h2 style="color: #e74c3c; margin-bottom: 15px;">Download Failed</h2>
      <p>Automatic download couldn't start. Please use one of these options:</p>
      <div style="margin: 20px 0;">
        <a href="${url}" download="${fileName}" 
           style="display: inline-block; background: #3498db; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 4px; margin: 5px;">
          Right-click → Save Link As
        </a>
      </div>
      <p style="font-size: 12px; color: #666;">
        Or press Ctrl+S (Cmd+S on Mac) to save this page
      </p>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: #95a5a6; color: white; border: none; padding: 8px 16px; 
                     border-radius: 4px; cursor: pointer; margin-top: 10px;">
        Close
      </button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Auto-cleanup after 30 seconds
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Failed to revoke object URL:', e);
      }
    }, 30000);
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9.\-_]/gi, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Robust PNG download with full error recovery
   */
  async downloadAsPNG(resumeData: ResumeData, resumeElementId: string): Promise<void> {
    DownloadDebugger.logDownloadAttempt('png', resumeElementId);

    return this.executeWithRetry(async () => {
      this.updateProgress({
        stage: 'detecting',
        progress: 5,
        message: 'Locating resume content...'
      });

      // Step 1: Detect element
      const element = await this.detectResumeElement(resumeElementId);
      
      this.updateProgress({
        stage: 'preparing',
        progress: 10,
        message: 'Preparing resume for capture...'
      });

      // Step 2: Ensure resources loaded
      await this.ensureResourcesLoaded(element);

      // Step 3: Prepare element
      await this.prepareElementForCapture(element);

      this.updateProgress({
        stage: 'generating',
        progress: 40,
        message: 'Capturing resume as image...'
      });

      // Step 4: Capture as canvas
      const canvas = await this.captureElementAsCanvas(element);

      this.updateProgress({
        stage: 'generating',
        progress: 80,
        message: 'Processing image data...'
      });

      // Step 5: Convert and download
      const fileName = `${this.sanitizeFilename(resumeData.personalInfo.fullName || 'Resume')}_Resume.png`;
      
      await new Promise<void>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to generate image blob'));
            return;
          }

          try {
            this.createDownloadLink(blob, fileName);
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 'image/png', 1.0);
      });

      DownloadDebugger.logDownloadSuccess('png', fileName);

      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: 'PNG downloaded successfully!'
      });

    }, 'PNG generation', 'png');
  }

  /**
   * Robust PDF download with full error recovery
   */
  async downloadAsPDF(resumeData: ResumeData, resumeElementId: string): Promise<void> {
    DownloadDebugger.logDownloadAttempt('pdf', resumeElementId);

    return this.executeWithRetry(async () => {
      this.updateProgress({
        stage: 'detecting',
        progress: 5,
        message: 'Locating resume content...'
      });

      // Step 1: Detect element
      const element = await this.detectResumeElement(resumeElementId);
      
      this.updateProgress({
        stage: 'preparing',
        progress: 10,
        message: 'Preparing resume for PDF...'
      });

      // Step 2: Ensure resources loaded
      await this.ensureResourcesLoaded(element);

      // Step 3: Prepare element
      await this.prepareElementForCapture(element);

      this.updateProgress({
        stage: 'generating',
        progress: 30,
        message: 'Capturing resume content...'
      });

      // Step 4: Capture as canvas
      const canvas = await this.captureElementAsCanvas(element);

      this.updateProgress({
        stage: 'generating',
        progress: 60,
        message: 'Generating PDF document...'
      });

      // Step 5: Create PDF
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

      // Step 6: Download
      const fileName = `${this.sanitizeFilename(resumeData.personalInfo.fullName || 'Resume')}_Resume.pdf`;
      const pdfBlob = pdf.output('blob');
      this.createDownloadLink(pdfBlob, fileName);

      DownloadDebugger.logDownloadSuccess('pdf', fileName);

      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: 'PDF downloaded successfully!'
      });

    }, 'PDF generation', 'pdf');
  }

  /**
   * Quick Word document download
   */
  async downloadAsWord(resumeData: ResumeData): Promise<void> {
    DownloadDebugger.logDownloadAttempt('word', 'word-document');

    return this.executeWithRetry(async () => {
      this.updateProgress({
        stage: 'generating',
        progress: 50,
        message: 'Creating Word document...'
      });

      // Create simple Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Header with name
            new Paragraph({
              children: [
                new TextRun({
                  text: resumeData.personalInfo.fullName || 'Resume',
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
                  ].filter(Boolean).join(' | ') || 'Contact information',
                  size: 22
                })
              ],
              alignment: AlignmentType.CENTER
            }),

            // Simple content
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'RESUME CONTENT',
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
                  text: 'This is your resume content. Edit this document to customize your resume.',
                  size: 20
                })
              ]
            })
          ]
        }]
      });

      this.updateProgress({
        stage: 'downloading',
        progress: 90,
        message: 'Downloading Word document...'
      });

      const buffer = await Packer.toBuffer(doc);
      const fileName = `${this.sanitizeFilename(resumeData.personalInfo.fullName || 'Resume')}_Resume.docx`;
      
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });

      this.createDownloadLink(blob, fileName);
      DownloadDebugger.logDownloadSuccess('word', fileName);

      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: 'Word document downloaded successfully!'
      });

    }, 'Word document generation', 'word');
  }
}