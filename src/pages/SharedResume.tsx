import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router-dom';
import { User, MapPin, Mail, Phone, Linkedin, Github } from 'lucide-react';

export const SharedResume: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [metaTags, setMetaTags] = useState<Array<{ property: string; content: string }>>([]);

  const name = searchParams.get('name') || 'Professional';
  const role = searchParams.get('role') || 'Seeking Opportunities';

  useEffect(() => {
    // Set meta tags for better social sharing
    const tags = [
      { property: 'og:title', content: `${name}'s Professional Resume` },
      { property: 'og:description', content: `View ${name}'s resume for ${role} positions. Created with TalentScape AI.` },
      { property: 'og:url', content: window.location.href },
      { property: 'og:type', content: 'profile' },
      { property: 'og:site_name', content: 'TalentScape AI' },
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:title', content: `${name}'s Professional Resume` },
      { property: 'twitter:description', content: `View ${name}'s resume for ${role} positions.` }
    ];

    setMetaTags(tags);

    // Dynamically update meta tags
    tags.forEach(tag => {
      let metaTag = document.querySelector(`meta[property="${tag.property}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', tag.property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', tag.content);
    });

    // Update page title
    document.title = `${name}'s Resume - TalentScape AI`;
  }, [name, role]);

  return (
    <div className="min-h-screen bg-gradient-secondary py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Shared Resume
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            This resume was created and shared using TalentScape AI's professional resume builder.
          </p>
        </div>

        {/* Resume Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-primary text-white">
              <div className="flex items-center justify-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <CardTitle className="text-3xl text-white">{name}</CardTitle>
                  <p className="text-white/90 text-lg">{role}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Resume Preview</h2>
                  <p className="text-muted-foreground">
                    This is a shared preview of {name}'s professional resume. 
                    The full resume was created using TalentScape AI's advanced resume building platform.
                  </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">Professional Design</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      ATS-optimized resume templates
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">AI-Powered</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Smart recommendations and optimization
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Badge className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">Multiple Formats</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Download as PDF, Word, or image
                    </p>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="bg-primary/5 rounded-lg p-6 mt-8">
                  <h3 className="text-lg font-semibold mb-2">Create Your Own Professional Resume</h3>
                  <p className="text-muted-foreground mb-4">
                    Build a stunning resume like this one with TalentScape AI's intelligent resume builder.
                  </p>
                  <Button 
                    className="bg-gradient-primary hover:bg-primary-hover"
                    onClick={() => window.location.href = '/'}
                  >
                    Start Building Your Resume
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground">
          <p className="text-sm">
            This resume was created with{' '}
            <a href="/" className="text-primary hover:underline">
              TalentScape AI
            </a>{' '}
            - The intelligent resume builder that helps you land your dream job.
          </p>
        </div>
      </div>
    </div>
  );
};