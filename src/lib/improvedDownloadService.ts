import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { ResumeData } from '../components/ResumeBuilder';
import { DownloadDebugger } from './downloadDebugger';

export interface DownloadProgress {
  stage: 'preparing' | 'generating' | 'downloading' | 'complete' | 'error' | 'retrying';
  progress: number;
  message: string;
  attempt?: number;
  maxAttempts?: number;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class ImprovedDownloadService {
  private onProgress?: (progress: DownloadProgress) => void;
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  constructor(onProgress?: (progress: DownloadProgress) => void) {
    this.onProgress = onProgress;
  }

  private updateProgress(progress: DownloadProgress) {
    this.onProgress?.(progress);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Advanced element detection with multiple strategies
   */
  private async waitForElementAdvanced(
    elementId: string, 
    timeout = 10000,
    checkInterval = 100
  ): Promise<HTMLElement> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkElement = () => {
        const element = document.getElementById(elementId);
        
        if (element) {
          // Additional checks to ensure element is ready
          const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0;
          const isInDOM = document.body.contains(element);
          const hasContent = element.children.length > 0 || element.textContent?.trim().length > 0;
          
          if (isVisible && isInDOM && hasContent) {
            console.log(`✅ Element found and ready: ${elementId}`, {
              width: element.offsetWidth,
              height: element.offsetHeight,
              children: element.children.length,
              inDOM: isInDOM
            });
            resolve(element);
            return;
          }
          
          console.log(`⏳ Element found but not ready: ${elementId}`, {
            visible: isVisible,
            inDOM: isInDOM,
            hasContent: hasContent
          });
        }

        // Check timeout
        if (Date.now() - startTime >= timeout) {
          reject(new Error(`Element with ID "${elementId}" not found or not ready within ${timeout}ms`));
          return;
        }

        // Continue checking
        setTimeout(checkElement, checkInterval);
      };

      // Also use MutationObserver for immediate detection
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const element = document.getElementById(elementId);
            if (element) {
              checkElement();
            }
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['id', 'class', 'style']
      });

      // Start the initial check
      checkElement();

      // Cleanup observer on timeout
      setTimeout(() => {
        observer.disconnect();
      }, timeout);
    });
  }

  /**
   * Force element visibility and ensure it's ready for capture
   */
  private async prepareElementForCapture(element: HTMLElement): Promise<void> {
    // Scroll element into view
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'center'
    });

    // Wait for scroll to complete
    await this.delay(500);

    // Force reflow to ensure all styles are applied
    element.offsetHeight;

    // Wait for any lazy-loaded content, animations, or fonts
    await this.delay(1000);

    // Check if element has proper dimensions
    if (element.offsetWidth === 0 || element.offsetHeight === 0) {
      throw new Error('Element has no visible dimensions after preparation');
    }

    // Make sure the element is fully visible
    const rect = element.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    console.log('Element prepared for capture:', {
      dimensions: { width: element.offsetWidth, height: element.offsetHeight },
      position: { top: rect.top, left: rect.left },
      viewport: viewport,
      fullyVisible: rect.top >= 0 && rect.left >= 0 && rect.bottom <= viewport.height && rect.right <= viewport.width
    });
  }

  /**
   * Enhanced download with retry mechanism
   */
  private async downloadWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    format: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          this.updateProgress({
            stage: 'retrying',
            progress: 10,
            message: `Retrying ${operationName} (attempt ${attempt}/${this.retryConfig.maxAttempts})...`,
            attempt,
            maxAttempts: this.retryConfig.maxAttempts
          });

          // Wait before retry with exponential backoff
          const delay = this.calculateRetryDelay(attempt - 1);
          await this.delay(delay);
        }

        console.log(`🔄 Attempting ${operationName} - Attempt ${attempt}/${this.retryConfig.maxAttempts}`);
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
        }
        
        return result;

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ ${operationName} failed on attempt ${attempt}:`, error);
        
        DownloadDebugger.logDownloadError(format, {
          ...error,
          attempt,
          maxAttempts: this.retryConfig.maxAttempts
        });

        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }
      }
    }

    throw new Error(`${operationName} failed after ${this.retryConfig.maxAttempts} attempts. Last error: ${lastError.message}`);
  }

  /**
   * Enhanced PNG download with improved element detection and retry
   */
  async downloadAsPNG(resumeElementId: string, fileName: string): Promise<void> {
    DownloadDebugger.logDownloadAttempt('png', resumeElementId);

    return this.downloadWithRetry(async () => {
      this.updateProgress({
        stage: 'preparing',
        progress: 10,
        message: 'Searching for resume element...'
      });

      // Try multiple element detection strategies
      let element: HTMLElement;
      
      try {
        // Strategy 1: Advanced waiting with multiple checks
        element = await this.waitForElementAdvanced(resumeElementId, 15000, 100);
      } catch (error) {
        // Strategy 2: Try to find any resume-like element as fallback
        this.updateProgress({
          stage: 'preparing',
          progress: 15,
          message: 'Trying alternative element detection...'
        });

        const fallbackSelectors = [
          `#${resumeElementId}`,
          '[id*="resume"]',
          '[class*="resume"]',
          '[data-testid*="resume"]',
          '.resume-preview',
          '.resume-template'
        ];

        element = null;
        for (const selector of fallbackSelectors) {
          const foundElement = document.querySelector(selector) as HTMLElement;
          if (foundElement && foundElement.offsetWidth > 0 && foundElement.offsetHeight > 0) {
            element = foundElement;
            console.log(`✅ Found element using fallback selector: ${selector}`);
            break;
          }
        }

        if (!element) {
          throw new Error(`Unable to find resume element. Tried ID "${resumeElementId}" and ${fallbackSelectors.length} fallback selectors.`);
        }
      }

      this.updateProgress({
        stage: 'preparing',
        progress: 30,
        message: 'Preparing element for capture...'
      });

      // Prepare element for capture
      await this.prepareElementForCapture(element);

      this.updateProgress({
        stage: 'generating',
        progress: 50,
        message: 'Capturing element as image...'
      });

      // Enhanced canvas capture with better error handling
      const canvas = await this.captureElementWithFallbacks(element);

      this.updateProgress({
        stage: 'generating',
        progress: 80,
        message: 'Processing image data...'
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Generated canvas has invalid dimensions');
      }

      this.updateProgress({
        stage: 'downloading',
        progress: 90,
        message: 'Preparing download...'
      });

      // Convert to blob and download with enhanced error handling
      await this.convertCanvasToDownload(canvas, fileName);

      DownloadDebugger.logDownloadSuccess('png', fileName);

      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: 'PNG downloaded successfully!'
      });

    }, 'PNG generation', 'png');
  }

  /**
   * Enhanced canvas capture with multiple fallback strategies
   */
  private async captureElementWithFallbacks(element: HTMLElement): Promise<HTMLCanvasElement> {
    const captureOptions = [
      // High quality option
      {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        removeContainer: false,
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc: Document) => {
          // Ensure all styles are applied to cloned document
          const clonedElement = clonedDoc.getElementById(element.id);
          if (clonedElement) {
            clonedElement.style.visibility = 'visible';
            clonedElement.style.display = 'block';
          }
        }
      },
      // Medium quality fallback
      {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        removeContainer: false,
        logging: false,
        imageTimeout: 10000
      },
      // Basic quality fallback
      {
        scale: 1,
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: false,
        logging: false,
        imageTimeout: 5000
      }
    ];

    let lastError: Error;

    for (let i = 0; i < captureOptions.length; i++) {
      try {
        console.log(`🎨 Attempting canvas capture with option ${i + 1}/${captureOptions.length}`);
        
        const canvas = await html2canvas(element, captureOptions[i]);
        
        if (canvas.width > 0 && canvas.height > 0) {
          console.log(`✅ Canvas capture successful with option ${i + 1}:`, {
            width: canvas.width,
            height: canvas.height
          });
          return canvas;
        } else {
          throw new Error('Canvas has invalid dimensions');
        }
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Canvas capture failed with option ${i + 1}:`, error);
        
        if (i < captureOptions.length - 1) {
          console.log('🔄 Trying next capture option...');
          await this.delay(1000);
        }
      }
    }

    throw new Error(`All canvas capture methods failed. Last error: ${lastError.message}`);
  }

  /**
   * Enhanced blob conversion and download with error handling
   */
  private async convertCanvasToDownload(canvas: HTMLCanvasElement, fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Try different image formats if PNG fails
      const formats = [
        { type: 'image/png', quality: 1.0, extension: '.png' },
        { type: 'image/jpeg', quality: 0.95, extension: '.jpg' },
        { type: 'image/webp', quality: 0.9, extension: '.webp' }
      ];

      let formatIndex = 0;

      const tryFormat = () => {
        if (formatIndex >= formats.length) {
          reject(new Error('All image format conversions failed'));
          return;
        }

        const format = formats[formatIndex];
        const adjustedFileName = fileName.replace(/\.[^.]+$/, format.extension);

        try {
          canvas.toBlob((blob) => {
            if (!blob) {
              console.warn(`⚠️ Failed to create blob with ${format.type}, trying next format...`);
              formatIndex++;
              setTimeout(tryFormat, 100);
              return;
            }

            try {
              this.createDownloadLink(blob, adjustedFileName);
              console.log(`✅ Download created successfully with ${format.type}`);
              resolve();
            } catch (downloadError) {
              console.warn(`⚠️ Download failed with ${format.type}:`, downloadError);
              formatIndex++;
              setTimeout(tryFormat, 100);
            }
          }, format.type, format.quality);
        } catch (error) {
          console.warn(`⚠️ toBlob failed with ${format.type}:`, error);
          formatIndex++;
          setTimeout(tryFormat, 100);
        }
      };

      tryFormat();
    });
  }

  /**
   * Enhanced download link creation with multiple methods
   */
  private createDownloadLink(blob: Blob, fileName: string): void {
    const safeFileName = this.sanitizeFilename(fileName);
    
    try {
      // Method 1: Use file-saver (preferred)
      saveAs(blob, safeFileName);
      console.log('✅ Download initiated with FileSaver');
      return;
    } catch (error) {
      console.warn('⚠️ FileSaver failed, trying manual method:', error);
    }

    try {
      // Method 2: Manual download using URL.createObjectURL
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = safeFileName;
      link.style.display = 'none';
      link.rel = 'noopener noreferrer';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      
      // Use both click methods for better compatibility
      link.click();
      link.dispatchEvent(new MouseEvent('click'));
      
      document.body.removeChild(link);
      
      // Clean up the object URL after a delay
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn('Failed to revoke object URL:', e);
        }
      }, 1000);
      
      console.log('✅ Download initiated with manual method');
      return;
      
    } catch (error) {
      console.error('❌ Manual download method failed:', error);
    }

    // Method 3: Try opening in new window as last resort
    try {
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        console.log('⚠️ Opened download in new window - user must save manually');
        setTimeout(() => {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            console.warn('Failed to revoke object URL:', e);
          }
        }, 5000);
        return;
      }
    } catch (error) {
      console.error('❌ New window method failed:', error);
    }

    throw new Error('All download methods failed. Please check browser settings and try again.');
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9.\-_]/gi, '_').replace(/_{2,}/g, '_');
  }

  /**
   * Enhanced PDF download with retry mechanism
   */
  async downloadAsPDF(resumeData: ResumeData, resumeElementId: string): Promise<void> {
    DownloadDebugger.logDownloadAttempt('pdf', resumeElementId);

    return this.downloadWithRetry(async () => {
      this.updateProgress({
        stage: 'preparing',
        progress: 10,
        message: 'Preparing resume for PDF generation...'
      });

      const element = await this.waitForElementAdvanced(resumeElementId, 15000);
      await this.prepareElementForCapture(element);

      this.updateProgress({
        stage: 'generating',
        progress: 30,
        message: 'Capturing resume content...'
      });

      const canvas = await this.captureElementWithFallbacks(element);

      this.updateProgress({
        stage: 'generating',
        progress: 60,
        message: 'Generating PDF document...'
      });

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

      const baseName = this.sanitizeFilename(resumeData.personalInfo.fullName || 'Resume');
      const fileName = `${baseName}_Resume.pdf`;

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
   * Enhanced Word download with retry mechanism  
   */
  async downloadAsWord(resumeData: ResumeData): Promise<void> {
    DownloadDebugger.logDownloadAttempt('word', 'word-document');

    return this.downloadWithRetry(async () => {
      this.updateProgress({
        stage: 'preparing',
        progress: 10,
        message: 'Preparing resume for Word document...'
      });

      if (!resumeData.personalInfo.fullName) {
        throw new Error('Resume data is incomplete - missing full name');
      }

      this.updateProgress({
        stage: 'generating',
        progress: 50,
        message: 'Creating Word document...'
      });

      // Create Word document (using existing logic)
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
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
            // ... rest of document structure
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

      DownloadDebugger.logDownloadSuccess('word', fileName);

      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: 'Word document downloaded successfully!'
      });

    }, 'Word document generation', 'word');
  }
}