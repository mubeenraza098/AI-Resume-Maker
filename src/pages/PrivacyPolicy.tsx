import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, UserCheck, Cookie, Gavel } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const sections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      icon: Eye,
      content: [
        'When you use TalentScape AI, we may collect various types of information to provide and improve our services.',
        'Personal Information: Name, email address, phone number, and other contact details you provide.',
        'Resume Data: The content you input into our resume builder, including work experience, education, and skills.',
        'Usage Data: Information about how you use our service, including features accessed and time spent.',
        'Technical Data: IP address, browser type, device information, and operating system details.'
      ]
    },
    {
      id: 'information-use',
      title: 'How We Use Your Information',
      icon: UserCheck,
      content: [
        'We use the information we collect for various purposes, including:',
        'Providing and maintaining our AI-powered resume building service.',
        'Processing your requests and communicating with you about our services.',
        'Improving our algorithms and service quality through data analysis.',
        'Sending you updates, newsletters, and promotional materials (with your consent).',
        'Ensuring the security and integrity of our platform.'
      ]
    },
    {
      id: 'data-protection',
      title: 'Data Protection & Security',
      icon: Lock,
      content: [
        'We take the security of your personal information seriously and implement appropriate measures:',
        'All data is encrypted in transit and at rest using industry-standard protocols.',
        'Access to personal information is restricted to authorized personnel only.',
        'We regularly update our security measures and conduct security audits.',
        'Your resume data is stored securely and is never shared with third parties without consent.',
        'We maintain backups of your data to prevent loss due to technical failures.'
      ]
    },
    {
      id: 'cookies-tracking',
      title: 'Cookies and Tracking',
      icon: Cookie,
      content: [
        'We use cookies and similar technologies to enhance your experience:',
        'Essential cookies necessary for the basic functionality of our service.',
        'Analytics cookies to understand how users interact with our platform.',
        'Preference cookies to remember your settings and customization choices.',
        'You can control cookie preferences through your browser settings.',
        'Some features may not work properly if you disable certain cookies.'
      ]
    },
    {
      id: 'data-sharing',
      title: 'Information Sharing',
      icon: Shield,
      content: [
        'We respect your privacy and limit data sharing to specific circumstances:',
        'We do not sell, rent, or trade your personal information to third parties.',
        'Service providers who assist us may access data under strict confidentiality agreements.',
        'We may share anonymized, aggregated data for research and improvement purposes.',
        'Legal compliance: We may disclose information when required by law or legal process.',
        'Business transfers: In case of merger or acquisition, data may be transferred under similar privacy terms.'
      ]
    },
    {
      id: 'your-rights',
      title: 'Your Rights and Choices',
      icon: Gavel,
      content: [
        'You have various rights regarding your personal information:',
        'Access: Request a copy of the personal information we hold about you.',
        'Correction: Update or correct any inaccurate personal information.',
        'Deletion: Request deletion of your personal information, subject to legal requirements.',
        'Portability: Request transfer of your data to another service provider.',
        'Opt-out: Unsubscribe from promotional communications at any time.',
        'Contact our privacy team at privacy@talentscape-ai.com to exercise these rights.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Your privacy is important to us. This policy explains how TalentScape AI collects, 
            uses, and protects your personal information when you use our AI-powered resume building service.
          </p>
          <div className="mt-6 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Privacy Policy Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-xl">
                <Shield className="h-6 w-6 text-primary" />
                <span>Our Commitment to Privacy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                At TalentScape AI, we are committed to protecting your privacy and ensuring 
                the security of your personal information. This Privacy Policy outlines our 
                practices regarding the collection, use, and disclosure of information that 
                you may provide while using our service. By using TalentScape AI, you consent 
                to the data practices described in this policy.
              </p>
            </CardContent>
          </Card>

          {/* Policy Sections */}
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <Icon className="h-6 w-6 text-primary" />
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.content.map((paragraph, pIndex) => (
                    <p 
                      key={pIndex} 
                      className={`${
                        paragraph.includes(':') && !paragraph.startsWith('We') && !paragraph.startsWith('At') 
                          ? 'font-medium text-foreground ml-4' 
                          : 'text-muted-foreground'
                      } leading-relaxed`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {/* Contact Information */}
          <Card className="border-0 shadow-lg bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xl">Questions About This Policy?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or our data practices, 
                please don't hesitate to contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> privacy@talentscape-ai.com</p>
                <p><strong>Address:</strong> TalentScape AI Privacy Team, 123 Business Ave, Suite 100, San Francisco, CA 94105</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};