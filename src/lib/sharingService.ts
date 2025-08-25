import { ResumeData } from '../components/ResumeBuilder';

export interface ShareableContent {
  title: string;
  description: string;
  url: string;
  hashtags: string[];
}

export class SharingService {
  private generateShareableContent(resumeData: ResumeData): ShareableContent {
    const fullName = resumeData.personalInfo.fullName || 'Professional';
    const targetRole = resumeData.personalInfo.targetRole || 'Professional';
    const industry = resumeData.personalInfo.industry || 'Various Industries';

    return {
      title: `${fullName}'s Professional Resume`,
      description: `Check out ${fullName}'s resume for ${targetRole} positions in ${industry}. Created with TalentScape AI.`,
      url: window.location.origin,
      hashtags: ['resume', 'career', 'hiring', 'jobs', targetRole.toLowerCase().replace(/\s+/g, '')]
    };
  }

  generateShareableLink(resumeData: ResumeData): string {
    // In a real application, you would generate a unique URL for the resume
    // For now, we'll create a shareable link with query parameters
    const params = new URLSearchParams({
      name: resumeData.personalInfo.fullName,
      role: resumeData.personalInfo.targetRole || '',
      shared: 'true'
    });
    
    return `${window.location.origin}/shared-resume?${params.toString()}`;
  }

  openEmailClient(resumeData: ResumeData, attachmentNote: string = ''): void {
    const content = this.generateShareableContent(resumeData);
    const subject = encodeURIComponent(content.title);
    
    const body = encodeURIComponent(`
Hi,

I'd like to share my professional resume with you. ${content.description}

${attachmentNote ? `${attachmentNote}\n\n` : ''}You can view my profile at: ${content.url}

Best regards,
${resumeData.personalInfo.fullName}

Contact Information:
Email: ${resumeData.personalInfo.email}
Phone: ${resumeData.personalInfo.phone}
${resumeData.personalInfo.linkedIn ? `LinkedIn: ${resumeData.personalInfo.linkedIn}` : ''}
${resumeData.personalInfo.github ? `GitHub: ${resumeData.personalInfo.github}` : ''}
    `.trim());

    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
  }

  copyShareableLink(resumeData: ResumeData): Promise<boolean> {
    const shareableLink = this.generateShareableLink(resumeData);
    
    if (navigator.clipboard && window.isSecureContext) {
      // Modern browsers with secure context
      return navigator.clipboard.writeText(shareableLink)
        .then(() => true)
        .catch(() => false);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareableLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return Promise.resolve(success);
      } catch (error) {
        document.body.removeChild(textArea);
        return Promise.resolve(false);
      }
    }
  }

  getLinkedInShareUrl(resumeData: ResumeData): string {
    const content = this.generateShareableContent(resumeData);
    const params = new URLSearchParams({
      mini: 'true',
      url: content.url,
      title: content.title,
      summary: content.description
    });
    
    return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
  }

  getTwitterShareUrl(resumeData: ResumeData): string {
    const content = this.generateShareableContent(resumeData);
    const tweetText = `${content.description} #${content.hashtags.join(' #')}`;
    
    const params = new URLSearchParams({
      text: tweetText,
      url: content.url
    });
    
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }

  getFacebookShareUrl(resumeData: ResumeData): string {
    const content = this.generateShareableContent(resumeData);
    const params = new URLSearchParams({
      u: content.url,
      quote: content.description
    });
    
    return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
  }

  getWhatsAppShareUrl(resumeData: ResumeData): string {
    const content = this.generateShareableContent(resumeData);
    const message = `${content.description} ${content.url}`;
    
    const params = new URLSearchParams({
      text: message
    });
    
    return `https://wa.me/?${params.toString()}`;
  }

  openSocialShare(platform: 'linkedin' | 'twitter' | 'facebook' | 'whatsapp', resumeData: ResumeData): void {
    let shareUrl = '';
    
    switch (platform) {
      case 'linkedin':
        shareUrl = this.getLinkedInShareUrl(resumeData);
        break;
      case 'twitter':
        shareUrl = this.getTwitterShareUrl(resumeData);
        break;
      case 'facebook':
        shareUrl = this.getFacebookShareUrl(resumeData);
        break;
      case 'whatsapp':
        shareUrl = this.getWhatsAppShareUrl(resumeData);
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    }
  }

  async shareWithNativeAPI(resumeData: ResumeData): Promise<boolean> {
    if (!navigator.share) {
      return false;
    }

    const content = this.generateShareableContent(resumeData);

    try {
      await navigator.share({
        title: content.title,
        text: content.description,
        url: content.url
      });
      return true;
    } catch (error) {
      console.log('Native sharing cancelled or failed:', error);
      return false;
    }
  }

  // Generate meta tags for better social sharing (for server-side rendering or when sharing specific resume pages)
  generateMetaTags(resumeData: ResumeData): Array<{ property: string; content: string }> {
    const content = this.generateShareableContent(resumeData);
    
    return [
      { property: 'og:title', content: content.title },
      { property: 'og:description', content: content.description },
      { property: 'og:url', content: content.url },
      { property: 'og:type', content: 'profile' },
      { property: 'og:site_name', content: 'TalentScape AI' },
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:title', content: content.title },
      { property: 'twitter:description', content: content.description },
      { property: 'twitter:url', content: content.url }
    ];
  }
}