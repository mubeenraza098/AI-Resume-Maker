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
   * Advanced element detection with multiple fallback strategies
   */
  private async detectResumeElement(elementId: string): Promise<HTMLElement> {
    const strategies = [...this.elementDetectionStrategies];
    // Set the direct ID strategy selector
    strategies[0].selector = `#${elementId}`;

    let bestMatch: { element: HTMLElement; strategy: string; score: number } | null = null;

    for (const strategy of strategies.sort((a, b) => a.priority - b.priority)) {
      try {
        const elements = document.querySelectorAll(strategy.selector) as NodeListOf<HTMLElement>;
        
        for (const element of elements) {
          const score = this.scoreElement(element);
          
          if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { element, strategy: strategy.name, score };
          }
        }
        
        // If we found a high-scoring element, use it
        if (bestMatch && bestMatch.score >= 80) {
          console.log(`✅ Found resume element using ${bestMatch.strategy} strategy (score: ${bestMatch.score})`);
          return bestMatch.element;
        }
      } catch (error) {
        console.warn(`Strategy "${strategy.name}" failed:`, error);
      }
    }

    if (bestMatch) {
      console.log(`⚠️ Using best available element from ${bestMatch.strategy} strategy (score: ${bestMatch.score})`);
      return bestMatch.element;
    }

    throw new Error(`Could not find any suitable resume element. Tried ${strategies.length} detection strategies.`);
  }

  /**
   * Score an element based on how likely it is to be a resume
   */
  private scoreElement(element: HTMLElement): number {
    let score = 0;

    // Basic visibility checks
    if (!document.body.contains(element)) return 0;
    if (element.offsetWidth === 0 || element.offsetHeight === 0) return 0;
    if (getComputedStyle(element).display === 'none') return 0;

    // Size scoring
    const rect = element.getBoundingClientRect();
    if (rect.height >= 400) score += 30; // Good height for a resume
    if (rect.width >= 300) score += 20; // Good width
    if (rect.height >= 800) score += 10; // Very tall, likely full resume

    // Content scoring
    const text = element.textContent || '';
    const textLength = text.trim().length;
    if (textLength > 100) score += 20;
    if (textLength > 500) score += 10;

    // Resume-specific content patterns
    const resumeKeywords = [
      /\b(experience|employment|work|job)\b/i,
      /\b(education|degree|university|school)\b/i,
      /\b(skills|abilities|competencies)\b/i,
      /\b(contact|email|phone|address)\b/i,
      /\b(objective|summary|profile)\b/i,
      /\b(certifications?|licenses?)\b/i
    ];

    let keywordMatches = 0;
    resumeKeywords.forEach(pattern => {
      if (pattern.test(text)) {
        keywordMatches++;
        score += 8;
      }
    });

    // Structure scoring
    const childrenCount = element.children.length;
    if (childrenCount >= 3) score += 15; // Multiple sections
    if (childrenCount >= 5) score += 10; // Well-structured

    // Class and ID scoring
    const className = element.className.toLowerCase();
    const elementId = element.id.toLowerCase();
    
    if (className.includes('resume') || elementId.includes('resume')) score += 25;
    if (className.includes('preview') || elementId.includes('preview')) score += 15;
    if (className.includes('template')) score += 10;

    // Penalty for common non-resume elements
    if (className.includes('nav') || className.includes('header') || className.includes('footer')) {
      score -= 20;
    }

    console.log(`Element scoring: ${element.tagName}${elementId ? '#' + elementId : ''}${className ? '.' + className.split(' ').join('.') : ''} = ${score}pts (${keywordMatches} keywords, ${childrenCount} children)`);

    return Math.max(0, score);
  }

  /**
   * Ensure all resources are loaded before capture
   */
  private async ensureResourcesLoaded(element: HTMLElement): Promise<void> {
    this.updateProgress({
      stage: 'loading',
      progress: 15,
      message: 'Ensuring all resources are loaded...',
      substage: 'checking images'
    });

    // Wait for images to load
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('Image load timeout:', img.src);
          resolve(); // Don't fail the whole process for one image
        }, 5000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeout);
          console.warn('Image failed to load:', img.src);
          resolve(); // Don't fail for broken images
        };
      });
    });

    await Promise.all(imagePromises);

    this.updateProgress({
      stage: 'loading',
      progress: 25,
      message: 'Ensuring all resources are loaded...',
      substage: 'checking fonts'
    });

    // Wait for fonts to load
    if ('fonts' in document) {
      try {
        await document.fonts.ready;
      } catch (error) {
        console.warn('Font loading failed:', error);
      }
    }

    // Force layout recalculation
    void element.offsetHeight;

    // Additional wait for any lazy-loaded content or animations
    await this.delay(1500);

    this.updateProgress({
      stage: 'loading',
      progress: 35,
      message: 'Resources loaded, preparing for capture...',
    });
  }

  /**
   * Prepare element for optimal capture
   */
  private async prepareElementForCapture(element: HTMLElement): Promise<void> {
    // Scroll element into view
    element.scrollIntoView({ 
      behavior: 'auto', // Use 'auto' for immediate scrolling
      block: 'start',
      inline: 'start'
    });

    // Wait for scroll to complete
    await this.delay(300);

    // Ensure element is visible and has proper styling
    const style = getComputedStyle(element);
    if (style.transform !== 'none') {
      console.warn('Element has transforms that may affect capture');
    }

    // Force repaint
    element.style.willChange = 'transform';
    void element.offsetHeight;
    element.style.willChange = '';

    // Final preparation wait
    await this.delay(500);
  }

  /**
   * Enhanced canvas capture with multiple quality strategies
   */
  private async captureElementAsCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    const captureStrategies = [
      // Strategy 1: High quality
      {
        name: 'High Quality',
        options: {
          scale: 3,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          removeContainer: false,
          logging: false,
          imageTimeout: 15000,
          width: element.offsetWidth,
          height: element.offsetHeight,
          windowWidth: Math.max(element.offsetWidth, window.innerWidth),
          windowHeight: Math.max(element.offsetHeight, window.innerHeight),
          onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
            // Ensure all styles are properly cloned
            const originalStyle = getComputedStyle(element);
            const clonedStyle = clonedElement.style;
            
            // Copy critical styles
            clonedStyle.visibility = 'visible';
            clonedStyle.display = 'block';
            clonedStyle.position = 'relative';
            clonedStyle.left = '0';
            clonedStyle.top = '0';
            clonedStyle.transform = 'none';
            clonedStyle.maxWidth = 'none';
            clonedStyle.maxHeight = 'none';
            clonedStyle.overflow = 'visible';
            
            // Fix any broken images or resources
            const clonedImages = clonedElement.querySelectorAll('img');
            clonedImages.forEach(img => {
              if (!img.complete || !img.src) {
                img.style.display = 'none';
              }
            });
          }
        }
      },
      // Strategy 2: Medium quality with CORS relaxed
      {
        name: 'Medium Quality',
        options: {
          scale: 2,
          useCORS: true,
          allowTaint: true, // Allow tainted canvas
          backgroundColor: '#ffffff',
          removeContainer: false,
          logging: false,
          imageTimeout: 10000,
          width: element.offsetWidth,
          height: element.offsetHeight
        }
      },
      // Strategy 3: Basic quality, most compatible
      {
        name: 'Basic Quality',
        options: {
          scale: 1,
          useCORS: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          removeContainer: false,
          logging: false,
          imageTimeout: 5000,
          ignoreElements: (element: Element) => {
            // Skip potentially problematic elements
            const tagName = element.tagName.toLowerCase();
            return ['iframe', 'embed', 'object', 'canvas'].includes(tagName);
          }
        }
      }
    ];

    let lastError: Error | null = null;

    for (let i = 0; i < captureStrategies.length; i++) {
      const strategy = captureStrategies[i];
      
      try {
        this.updateProgress({
          stage: 'generating',
          progress: 50 + (i * 10),
          message: `Capturing with ${strategy.name}...`,
          substage: strategy.name
        });

        console.log(`🎨 Attempting canvas capture with ${strategy.name}`);
        
        const canvas = await html2canvas(element, strategy.options);
        
        if (canvas.width > 0 && canvas.height > 0) {
          console.log(`✅ Canvas capture successful with ${strategy.name}:`, {
            width: canvas.width,
            height: canvas.height,
            area: canvas.width * canvas.height
          });
          return canvas;
        } else {
          throw new Error(`Canvas has invalid dimensions: ${canvas.width}x${canvas.height}`);
        }
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Canvas capture failed with ${strategy.name}:`, error);
        
        if (i < captureStrategies.length - 1) {
          console.log('🔄 Trying next capture strategy...');
          await this.delay(1000);
        }
      }
    }

    throw new Error(`All ${captureStrategies.length} canvas capture strategies failed. Last error: ${lastError?.message}`);
  }

  /**
   * Enhanced download with comprehensive retry and error recovery
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    format: string
  ): Promise<T> {
    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      // Check timeout
      if (Date.now() - startTime > this.retryConfig.timeoutMs) {
        throw new Error(`Operation timed out after ${this.retryConfig.timeoutMs}ms`);
      }

      try {
        if (attempt > 1) {
          const retryDelay = this.calculateRetryDelay(attempt - 1);
          
          this.updateProgress({
            stage: 'retrying',
            progress: 10,
            message: `Retrying ${operationName}...`,
            attempt,
            maxAttempts: this.retryConfig.maxAttempts,
            substage: `waiting ${Math.round(retryDelay / 1000)}s`
          });

          await this.delay(retryDelay);
        }

        console.log(`🔄 ${operationName} - Attempt ${attempt}/${this.retryConfig.maxAttempts}`);
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
          maxAttempts: this.retryConfig.maxAttempts,
          operationName
        });

        // For certain errors, don't retry
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('not find') || errorMessage.includes('detection strategies')) {
          console.log(`💔 Non-recoverable error detected, stopping retries: ${errorMessage}`);
          break;
        }

        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }
      }
    }

    throw new Error(`${operationName} failed after ${this.retryConfig.maxAttempts} attempts and ${Math.round((Date.now() - startTime) / 1000)}s. Last error: ${lastError?.message}`);
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
   * Robust Word document download
   */
  async downloadAsWord(resumeData: ResumeData): Promise<void> {
    DownloadDebugger.logDownloadAttempt('word', 'word-document');

    return this.executeWithRetry(async () => {
      this.updateProgress({
        stage: 'preparing',
        progress: 10,
        message: 'Preparing resume data for Word...'
      });

      if (!resumeData.personalInfo.fullName) {
        throw new Error('Resume data is incomplete - missing full name');
      }

      this.updateProgress({
        stage: 'generating',
        progress: 50,
        message: 'Creating Word document...'
      });

      // Create comprehensive Word document
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

            // Links
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
              new Paragraph({ text: '' }),
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
              new Paragraph({ text: '' }),
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
              ...resumeData.experience.flatMap((exp: { role: string; company: string; duration: string; achievements: string[] }) => [
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
                ...exp.achievements.map((achievement: string) => 
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `• ${achievement}`,
                        size: 20
                      })
                    ]
                  })
                ),
                new Paragraph({ text: '' })
              ])
            ] : []),

            // Skills
            ...(resumeData.skills.length > 0 ? [
              new Paragraph({ text: '' }),
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
              new Paragraph({ text: '' }),
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
              ...resumeData.education.map((edu: { degree: string; institution: string; year: string }) => 
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
              new Paragraph({ text: '' }),
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
              ...resumeData.certifications.map((cert: { name: string; issuer: string; year: string }) => 
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
      const fileName = `${this.sanitizeFilename(resumeData.personalInfo.fullName)}_Resume.docx`;
      
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