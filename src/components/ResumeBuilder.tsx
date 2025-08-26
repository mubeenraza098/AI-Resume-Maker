import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, User, Briefcase, GraduationCap, Award, Eye, Download, FileText, Palette, Target } from 'lucide-react';
import { ResumePreview } from './ResumePreview';
import { ThemeSelector, ResumeTheme } from './ThemeSelector';
import { AIRecommendations } from './AIRecommendations';
import { ExportOptions } from './ExportOptions';

export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    linkedIn: string;
    github: string;
    tagline: string;
    objective: string;
    profilePicture?: string;
    targetRole?: string;
    industry?: string;
  };
  skills: string[];
  experience: Array<{
    id: string;
    company: string;
    role: string;
    duration: string;
    achievements: string[];
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    year: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    year: string;
  }>;
}

const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    linkedIn: '',
    github: '',
    tagline: '',
    objective: '',
  },
  skills: [],
  experience: [],
  education: [],
  certifications: [],
};

export const ResumeBuilder: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [currentSkill, setCurrentSkill] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<ResumeTheme | null>(null);
  const [currentStep, setCurrentStep] = useState<'theme' | 'form' | 'recommendations' | 'preview' | 'export'>('theme');
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'professional' | 'creative'>('modern');

  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const addSkill = () => {
    if (currentSkill.trim() && !resumeData.skills.includes(currentSkill.trim())) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addExperience = () => {
    const newExperience = {
      id: Date.now().toString(),
      company: '',
      role: '',
      duration: '',
      achievements: ['']
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExperience]
    }));
  };

  const updateExperience = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addAchievement = (experienceId: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === experienceId 
          ? { ...exp, achievements: [...exp.achievements, ''] }
          : exp
      )
    }));
  };

  const updateAchievement = (experienceId: string, achievementIndex: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === experienceId 
          ? { 
              ...exp, 
              achievements: exp.achievements.map((ach, idx) => 
                idx === achievementIndex ? value : ach
              )
            }
          : exp
      )
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addEducation = () => {
    const newEducation = {
      id: Date.now().toString(),
      degree: '',
      institution: '',
      year: ''
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }));
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addCertification = () => {
    const newCertification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      year: ''
    };
    setResumeData(prev => ({
      ...prev,
      certifications: [...prev.certifications, newCertification]
    }));
  };

  const updateCertification = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.map(cert => 
        cert.id === id ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const removeCertification = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert.id !== id)
    }));
  };

  const addSkillFromRecommendation = (skill: string) => {
    if (!resumeData.skills.includes(skill)) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const handleExport = (format: 'pdf' | 'word' | 'png') => {
    // Mock export functionality - in real app would generate actual files
    console.log(`Exporting resume as ${format}`);
    // Here you would integrate with a PDF generation library, Word export, etc.
  };

  // Theme Selection Step
  if (currentStep === 'theme') {
    return (
      <ThemeSelector
        selectedTheme={selectedTheme}
        onThemeSelect={setSelectedTheme}
        onContinue={() => setCurrentStep('form')}
      />
    );
  }

  // Export Step
  if (currentStep === 'export') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-secondary">
        <div className="container mx-auto py-8">
          <div className="flex justify-between items-center mb-6">
            <Button 
              onClick={() => setCurrentStep('preview')} 
              variant="outline"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Back to Preview
            </Button>
          </div>
          
          {/* Always include the preview on export step for download to work */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left side: Resume Preview (hidden but needed for download) */}
            <div className="lg:col-span-1">
              <h3 className="text-xl font-semibold mb-4">Your Resume</h3>
              <div className="sticky top-4">
                <ResumePreview data={resumeData} template={selectedTemplate} />
              </div>
            </div>
            
            {/* Right side: Export Options (Direct Access) */}
            <div className="lg:col-span-1">
              <ExportOptions 
                onExport={handleExport} 
                resumeData={resumeData} 
                resumeElementId="resume-preview-element"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Preview Step
  if (currentStep === 'preview') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-secondary">
        <div className="container mx-auto py-8">
          <div className="flex justify-between items-center mb-6">
            <Button 
              onClick={() => setCurrentStep('recommendations')} 
              variant="outline"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Back to Recommendations
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setCurrentStep('export')}
              >
                <Download className="h-4 w-4" />
                Export Resume
              </Button>
            </div>
          </div>
          <ResumePreview data={resumeData} template={selectedTemplate} />
        </div>
      </div>
    );
  }

  // AI Recommendations Step
  if (currentStep === 'recommendations') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-secondary">
        <div className="container mx-auto py-8">
          <div className="flex justify-between items-center mb-6">
            <Button 
              onClick={() => setCurrentStep('form')} 
              variant="outline"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Back to Form
            </Button>
            <Button 
              onClick={() => setCurrentStep('preview')} 
              className="gap-2 bg-gradient-primary hover:bg-primary-hover"
            >
              <Eye className="h-4 w-4" />
              Preview Resume
            </Button>
          </div>
          <AIRecommendations 
            resumeData={resumeData}
            selectedTheme={selectedTheme!}
            onSkillAdd={addSkillFromRecommendation}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            AI Resume Builder
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create professional, ATS-friendly resumes that stand out. Build your career story with our intelligent resume builder.
          </p>
        </div>

        <div className="flex justify-center mb-6 gap-4">
          <Button 
            onClick={() => setCurrentStep('theme')} 
            variant="outline"
            className="gap-2"
          >
            <Palette className="h-4 w-4" />
            Change Theme
          </Button>
          <Button 
            onClick={() => setCurrentStep('recommendations')} 
            className="gap-2 bg-gradient-primary hover:bg-primary-hover"
            size="lg"
          >
            <Target className="h-4 w-4" />
            Get AI Insights
          </Button>
        </div>

        <Tabs defaultValue="personal" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="experience" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Education
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-2">
              <Award className="h-4 w-4" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="certifications" className="gap-2">
              <Award className="h-4 w-4" />
              Certs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Your basic information and professional profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={resumeData.personalInfo.fullName}
                      onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={resumeData.personalInfo.email}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      placeholder="john.doe@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={resumeData.personalInfo.phone}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      placeholder="+1-234-567-890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                    <Input
                      id="linkedIn"
                      value={resumeData.personalInfo.linkedIn}
                      onChange={(e) => updatePersonalInfo('linkedIn', e.target.value)}
                      placeholder="linkedin.com/in/johndoe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="github">GitHub Profile</Label>
                    <Input
                      id="github"
                      value={resumeData.personalInfo.github}
                      onChange={(e) => updatePersonalInfo('github', e.target.value)}
                      placeholder="github.com/johndoe"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="tagline">Professional Tagline *</Label>
                  <Input
                    id="tagline"
                    value={resumeData.personalInfo.tagline}
                    onChange={(e) => updatePersonalInfo('tagline', e.target.value)}
                    placeholder="Full-Stack Developer | AI Enthusiast"
                  />
                </div>
                
                  <div>
                    <Label htmlFor="targetRole">Target Role/Industry</Label>
                    <Input
                      id="targetRole"
                      value={resumeData.personalInfo.targetRole || ''}
                      onChange={(e) => updatePersonalInfo('targetRole', e.target.value)}
                      placeholder="Software Engineer, Data Analyst, Marketing Manager..."
                    />
                  </div>
                
                  <div>
                    <Label htmlFor="objective">Career Objective *</Label>
                    <Textarea
                      id="objective"
                      value={resumeData.personalInfo.objective}
                      onChange={(e) => updatePersonalInfo('objective', e.target.value)}
                      placeholder="Driven software engineer with 5+ years of experience building scalable applications..."
                      rows={3}
                    />
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Skills & Technologies</CardTitle>
                <CardDescription>
                  Add your technical and professional skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    placeholder="Enter a skill..."
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button onClick={addSkill} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="gap-2">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
                <CardDescription>
                  Add your professional work experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={addExperience} className="mb-6 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Experience
                </Button>
                
                <div className="space-y-6">
                  {resumeData.experience.map((exp) => (
                    <Card key={exp.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold">Experience Entry</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeExperience(exp.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label>Company Name *</Label>
                            <Input
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                              placeholder="Google"
                            />
                          </div>
                          <div>
                            <Label>Role/Position *</Label>
                            <Input
                              value={exp.role}
                              onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                              placeholder="Software Engineer"
                            />
                          </div>
                          <div>
                            <Label>Duration *</Label>
                            <Input
                              value={exp.duration}
                              onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)}
                              placeholder="2020-2023"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Key Achievements</Label>
                          <div className="space-y-2 mt-2">
                            {exp.achievements.map((achievement, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={achievement}
                                  onChange={(e) => updateAchievement(exp.id, index, e.target.value)}
                                  placeholder="Built internal tools that improved workflow efficiency by 35%"
                                />
                              </div>
                            ))}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => addAchievement(exp.id)}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add Achievement
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Education</CardTitle>
                <CardDescription>
                  Add your educational background
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={addEducation} className="mb-6 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Education
                </Button>
                
                <div className="space-y-4">
                  {resumeData.education.map((edu) => (
                    <Card key={edu.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold">Education Entry</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeEducation(edu.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Degree *</Label>
                            <Input
                              value={edu.degree}
                              onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                              placeholder="B.Sc. Computer Science"
                            />
                          </div>
                          <div>
                            <Label>Institution *</Label>
                            <Input
                              value={edu.institution}
                              onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                              placeholder="MIT"
                            />
                          </div>
                          <div>
                            <Label>Year *</Label>
                            <Input
                              value={edu.year}
                              onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                              placeholder="2016-2020"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Certifications & Projects</CardTitle>
                <CardDescription>
                  Add your professional certifications and notable projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={addCertification} className="mb-6 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Certification
                </Button>
                
                <div className="space-y-4">
                  {resumeData.certifications.map((cert) => (
                    <Card key={cert.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold">Certification Entry</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeCertification(cert.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={cert.name}
                              onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                              placeholder="AWS Certified Solutions Architect"
                            />
                          </div>
                          <div>
                            <Label>Issuer/Organization *</Label>
                            <Input
                              value={cert.issuer}
                              onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                              placeholder="Amazon Web Services"
                            />
                          </div>
                          <div>
                            <Label>Year *</Label>
                            <Input
                              value={cert.year}
                              onChange={(e) => updateCertification(cert.id, 'year', e.target.value)}
                              placeholder="2023"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};