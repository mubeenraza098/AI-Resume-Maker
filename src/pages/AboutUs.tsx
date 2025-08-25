import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Target, 
  Users, 
  Award, 
  Linkedin, 
  Twitter, 
  Mail, 
  Sparkles, 
  Zap, 
  Shield 
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image: string;
  skills: string[];
  social: {
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
}

export const AboutUs: React.FC = () => {
  const teamMembers: TeamMember[] = [
    {
      id: 'sarah-chen',
      name: 'Sarah Chen',
      role: 'Co-Founder & CEO',
      description: 'Former Google AI researcher with 10+ years in machine learning and talent acquisition technology.',
      image: 'SC',
      skills: ['AI/ML', 'Leadership', 'Strategy'],
      social: {
        linkedin: 'https://linkedin.com/in/sarah-chen',
        twitter: 'https://twitter.com/sarahchen_ai',
        email: 'sarah@talentscape-ai.com'
      }
    },
    {
      id: 'marcus-johnson',
      name: 'Marcus Johnson',
      role: 'Co-Founder & CTO',
      description: 'Full-stack engineer and former Microsoft architect, passionate about building scalable AI solutions.',
      image: 'MJ',
      skills: ['Engineering', 'Architecture', 'DevOps'],
      social: {
        linkedin: 'https://linkedin.com/in/marcus-johnson',
        twitter: 'https://twitter.com/marcus_codes',
        email: 'marcus@talentscape-ai.com'
      }
    },
    {
      id: 'emily-rodriguez',
      name: 'Dr. Emily Rodriguez',
      role: 'Head of AI Research',
      description: 'PhD in Natural Language Processing from Stanford, specializing in resume analysis and optimization.',
      image: 'ER',
      skills: ['NLP', 'Research', 'Data Science'],
      social: {
        linkedin: 'https://linkedin.com/in/emily-rodriguez-phd',
        email: 'emily@talentscape-ai.com'
      }
    },
    {
      id: 'david-kim',
      name: 'David Kim',
      role: 'Head of Product',
      description: 'Former product manager at LinkedIn, expert in user experience and career development platforms.',
      image: 'DK',
      skills: ['Product Strategy', 'UX Design', 'Analytics'],
      social: {
        linkedin: 'https://linkedin.com/in/david-kim-product',
        twitter: 'https://twitter.com/davidkim_ux',
        email: 'david@talentscape-ai.com'
      }
    },
    {
      id: 'lisa-thompson',
      name: 'Lisa Thompson',
      role: 'Head of Customer Success',
      description: 'Career counselor and HR expert with 15+ years helping professionals advance their careers.',
      image: 'LT',
      skills: ['Career Counseling', 'HR', 'Customer Success'],
      social: {
        linkedin: 'https://linkedin.com/in/lisa-thompson-careers',
        email: 'lisa@talentscape-ai.com'
      }
    },
    {
      id: 'alex-patel',
      name: 'Alex Patel',
      role: 'Lead Data Scientist',
      description: 'MIT graduate specializing in machine learning algorithms for resume matching and ATS optimization.',
      image: 'AP',
      skills: ['Data Science', 'ML Algorithms', 'Statistics'],
      social: {
        linkedin: 'https://linkedin.com/in/alex-patel-data',
        twitter: 'https://twitter.com/alex_data_sci',
        email: 'alex@talentscape-ai.com'
      }
    }
  ];

  const companyValues = [
    {
      icon: Brain,
      title: 'AI-Powered Innovation',
      description: 'We leverage cutting-edge artificial intelligence to revolutionize how resumes are created and optimized.'
    },
    {
      icon: Target,
      title: 'Results-Driven',
      description: 'Every feature we build is designed to help you land more interviews and advance your career.'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your personal information and career data are protected with enterprise-grade security measures.'
    },
    {
      icon: Sparkles,
      title: 'Continuous Learning',
      description: 'Our AI models constantly evolve to stay current with industry trends and hiring practices.'
    }
  ];

  const stats = [
    { number: '500K+', label: 'Resumes Created', icon: Award },
    { number: '85%', label: 'Interview Success Rate', icon: Target },
    { number: '150+', label: 'Industries Supported', icon: Sparkles },
    { number: '24/7', label: 'AI Assistant Available', icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            About TalentScape AI
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to democratize career success by making professional resume 
            creation accessible to everyone through the power of artificial intelligence.
          </p>
        </div>

        {/* Company Story */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Our Story</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none text-center">
              <p className="text-muted-foreground leading-relaxed text-lg">
                Founded in 2023, TalentScape AI was born from the frustration of seeing talented 
                individuals struggle with resume creation. Our founders, having worked at top tech 
                companies, noticed that even brilliant professionals often struggled to present 
                their experience effectively on paper.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg mt-4">
                By combining advanced AI with deep insights from recruitment experts, we've created 
                a platform that doesn't just build resumes—it crafts career narratives that resonate 
                with both human recruiters and ATS systems.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Company Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {companyValues.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="text-center border-0 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-3">{value.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="text-center border-0 shadow-lg">
                  <CardContent className="p-6">
                    <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                      {stat.number}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our diverse team of AI researchers, engineers, and career experts is dedicated 
              to helping you unlock your professional potential.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {teamMembers.map((member) => (
              <Card key={member.id} className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="text-center">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">{member.image}</span>
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="font-medium text-primary">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {member.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-center space-x-3 pt-2">
                    {member.social.linkedin && (
                      <Button variant="ghost" size="sm" className="p-2">
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    )}
                    {member.social.twitter && (
                      <Button variant="ghost" size="sm" className="p-2">
                        <Twitter className="h-4 w-4" />
                      </Button>
                    )}
                    {member.social.email && (
                      <Button variant="ghost" size="sm" className="p-2">
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Join Us Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg bg-primary/5">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Join Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl mx-auto">
                We're always looking for talented individuals who share our passion for 
                democratizing career success. If you're interested in joining our team, 
                we'd love to hear from you.
              </p>
              <Button className="bg-gradient-primary hover:bg-primary-hover">
                View Open Positions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};