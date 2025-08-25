export class DownloadDebugger {
  static checkBrowserSupport(): { 
    supported: boolean; 
    issues: string[]; 
    recommendations: string[] 
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check canvas support
    const canvas = document.createElement('canvas');
    if (!canvas.getContext || !canvas.getContext('2d')) {
      issues.push('Canvas API not supported');
      recommendations.push('Please update your browser to the latest version');
    }

    // Check Blob support
    if (typeof Blob === 'undefined') {
      issues.push('Blob API not supported');
      recommendations.push('Your browser is too old. Please use a modern browser like Chrome, Firefox, or Safari');
    }

    // Check URL.createObjectURL support
    if (typeof URL === 'undefined' || !URL.createObjectURL) {
      issues.push('URL.createObjectURL not supported');
      recommendations.push('Please enable JavaScript and use a modern browser');
    }

    // Check file download capabilities
    const link = document.createElement('a');
    if (typeof link.download === 'undefined') {
      issues.push('Download attribute not supported');
      recommendations.push('Your browser may not support automatic downloads. Try right-clicking and "Save As"');
    }

    // Check for popup blockers
    if (window.navigator && window.navigator.userAgent.includes('Chrome')) {
      recommendations.push('If downloads fail, check if popup blockers are enabled');
    }

    // Check for HTTPS (some features require secure context)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      issues.push('Not running in secure context');
      recommendations.push('Some download features may not work on non-HTTPS sites');
    }

    return {
      supported: issues.length === 0,
      issues,
      recommendations
    };
  }

  static logDownloadAttempt(format: string, resumeElementId: string): void {
    console.group(`🔄 Download Attempt: ${format.toUpperCase()}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Format:', format);
    console.log('Element ID:', resumeElementId);
    
    const element = document.getElementById(resumeElementId);
    if (element) {
      console.log('✅ Element found');
      console.log('Element dimensions:', {
        width: element.offsetWidth,
        height: element.offsetHeight,
        visible: element.offsetWidth > 0 && element.offsetHeight > 0
      });
    } else {
      console.log('❌ Element not found');
    }
    
    const support = this.checkBrowserSupport();
    console.log('Browser support:', support);
    console.groupEnd();
  }

  static logDownloadSuccess(format: string, fileName: string): void {
    console.log(`✅ Download successful: ${format.toUpperCase()} - ${fileName}`);
  }

  static logDownloadError(format: string, error: any): void {
    console.group(`❌ Download failed: ${format.toUpperCase()}`);
    console.error('Error:', error);
    console.log('Error type:', typeof error);
    console.log('Error message:', error?.message || 'Unknown error');
    
    if (error?.stack) {
      console.log('Stack trace:', error.stack);
    }
    
    const support = this.checkBrowserSupport();
    if (!support.supported) {
      console.log('Browser compatibility issues detected:', support.issues);
      console.log('Recommendations:', support.recommendations);
    }
    
    console.groupEnd();
  }

  static async testDownloadCapability(): Promise<{
    canDownload: boolean;
    testResults: Record<string, boolean>;
    errors: string[];
  }> {
    const testResults: Record<string, boolean> = {};
    const errors: string[] = [];

    try {
      // Test 1: Basic blob creation
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      testResults['blob_creation'] = true;
    } catch (error) {
      testResults['blob_creation'] = false;
      errors.push('Blob creation failed');
    }

    try {
      // Test 2: URL.createObjectURL
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const url = URL.createObjectURL(testBlob);
      URL.revokeObjectURL(url);
      testResults['object_url'] = true;
    } catch (error) {
      testResults['object_url'] = false;
      errors.push('URL.createObjectURL failed');
    }

    try {
      // Test 3: Canvas creation
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 50, 50);
        const dataUrl = canvas.toDataURL('image/png');
        testResults['canvas'] = dataUrl.startsWith('data:image/png');
      } else {
        testResults['canvas'] = false;
      }
    } catch (error) {
      testResults['canvas'] = false;
      errors.push('Canvas test failed');
    }

    try {
      // Test 4: File-saver capability (simulate)
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(testBlob);
      link.download = 'test.txt';
      testResults['download_link'] = true;
    } catch (error) {
      testResults['download_link'] = false;
      errors.push('Download link creation failed');
    }

    const canDownload = Object.values(testResults).every(result => result === true);

    return {
      canDownload,
      testResults,
      errors
    };
  }

  static generateDiagnosticReport(): string {
    const support = this.checkBrowserSupport();
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    let report = `=== Download Diagnostic Report ===\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `URL: ${window.location.href}\n`;
    report += `User Agent: ${userAgent}\n`;
    report += `Platform: ${platform}\n\n`;
    
    report += `Browser Support: ${support.supported ? '✅ SUPPORTED' : '❌ ISSUES DETECTED'}\n`;
    
    if (support.issues.length > 0) {
      report += `\nIssues:\n`;
      support.issues.forEach(issue => report += `- ${issue}\n`);
    }
    
    if (support.recommendations.length > 0) {
      report += `\nRecommendations:\n`;
      support.recommendations.forEach(rec => report += `- ${rec}\n`);
    }
    
    return report;
  }
}