import { useState, useEffect, useCallback } from 'react';

export interface PreviewReadinessState {
  isReady: boolean;
  isChecking: boolean;
  error: string | null;
  lastChecked: number | null;
  retryCount: number;
}

export interface PreviewReadinessConfig {
  elementId: string;
  maxRetries: number;
  retryDelay: number;
  checkInterval: number;
  timeout: number;
}

const defaultConfig: PreviewReadinessConfig = {
  elementId: 'resume-preview-element',
  maxRetries: 5,
  retryDelay: 1000,
  checkInterval: 500,
  timeout: 15000
};

export const usePreviewReadiness = (config: Partial<PreviewReadinessConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  const [state, setState] = useState<PreviewReadinessState>({
    isReady: false,
    isChecking: false,
    error: null,
    lastChecked: null,
    retryCount: 0
  });

  const checkElementReadiness = useCallback((element: HTMLElement): { ready: boolean; reason?: string } => {
    // Check if element exists and is in the DOM
    if (!document.body.contains(element)) {
      return { ready: false, reason: 'Element not in DOM' };
    }

    // Check if element is visible
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
      return { ready: false, reason: 'Element is hidden' };
    }

    if (element.offsetWidth === 0 || element.offsetHeight === 0) {
      return { ready: false, reason: 'Element has no dimensions' };
    }

    // Check if element has content
    const hasChildren = element.children.length > 0;
    const hasText = (element.textContent || '').trim().length > 0;
    
    if (!hasChildren && !hasText) {
      return { ready: false, reason: 'Element has no content' };
    }

    // Check for minimum content requirements (resume should be substantial)
    const minHeight = 200; // Resume should be at least 200px tall
    const minChildren = 2; // Resume should have at least 2 sections
    
    if (rect.height < minHeight) {
      return { ready: false, reason: `Element too small (${Math.round(rect.height)}px < ${minHeight}px)` };
    }

    if (hasChildren && element.children.length < minChildren) {
      return { ready: false, reason: `Not enough content sections (${element.children.length} < ${minChildren})` };
    }

    // Additional check for resume-specific content
    const resumeContent = element.textContent || '';
    const hasResumeIndicators = /name|email|phone|experience|education|skills/i.test(resumeContent);
    
    if (!hasResumeIndicators) {
      return { ready: false, reason: 'No resume-like content detected' };
    }

    return { ready: true };
  }, []);

  const checkPreviewReadiness = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ 
      ...prev, 
      isChecking: true, 
      error: null,
      lastChecked: Date.now()
    }));

    try {
      const element = document.getElementById(finalConfig.elementId);
      
      if (!element) {
        setState(prev => ({ 
          ...prev, 
          isChecking: false, 
          isReady: false,
          error: `Preview element '${finalConfig.elementId}' not found on page`
        }));
        return false;
      }

      const readinessCheck = checkElementReadiness(element);
      
      if (readinessCheck.ready) {
        setState(prev => ({ 
          ...prev, 
          isChecking: false, 
          isReady: true,
          error: null,
          retryCount: 0
        }));
        return true;
      } else {
        setState(prev => ({ 
          ...prev, 
          isChecking: false, 
          isReady: false,
          error: readinessCheck.reason || 'Preview not ready'
        }));
        return false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error checking preview';
      setState(prev => ({ 
        ...prev, 
        isChecking: false, 
        isReady: false,
        error: errorMessage
      }));
      return false;
    }
  }, [finalConfig.elementId, checkElementReadiness]);

  const waitForPreviewReadiness = useCallback(async (): Promise<boolean> => {
    const startTime = Date.now();
    let retryCount = 0;

    while (retryCount < finalConfig.maxRetries && (Date.now() - startTime) < finalConfig.timeout) {
      setState(prev => ({ ...prev, retryCount }));
      
      const isReady = await checkPreviewReadiness();
      if (isReady) {
        return true;
      }

      retryCount++;
      
      if (retryCount < finalConfig.maxRetries) {
        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
      }
    }

    // Final failure
    setState(prev => ({ 
      ...prev, 
      isChecking: false, 
      isReady: false,
      error: `Preview not ready after ${retryCount} attempts (${finalConfig.timeout}ms timeout)`,
      retryCount
    }));
    
    return false;
  }, [finalConfig.maxRetries, finalConfig.timeout, finalConfig.retryDelay, checkPreviewReadiness]);

  const forceCheck = useCallback(() => {
    checkPreviewReadiness();
  }, [checkPreviewReadiness]);

  const reset = useCallback(() => {
    setState({
      isReady: false,
      isChecking: false,
      error: null,
      lastChecked: null,
      retryCount: 0
    });
  }, []);

  // Auto-check on mount and when element ID changes
  useEffect(() => {
    checkPreviewReadiness();
  }, [checkPreviewReadiness]);

  // Periodic check when not ready
  useEffect(() => {
    if (state.isReady || state.isChecking) {
      return;
    }

    const interval = setInterval(() => {
      checkPreviewReadiness();
    }, finalConfig.checkInterval);

    return () => clearInterval(interval);
  }, [state.isReady, state.isChecking, finalConfig.checkInterval, checkPreviewReadiness]);

  return {
    ...state,
    checkPreviewReadiness,
    waitForPreviewReadiness,
    forceCheck,
    reset,
    config: finalConfig
  };
};