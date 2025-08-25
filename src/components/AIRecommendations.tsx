import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Star,
  Plus,
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react';
import { ResumeData } from './ResumeBuilder';
import { ResumeTheme } from './ThemeSelector';

interface AIRecommendationsProps {
  resumeData: ResumeData;
  selectedTheme: ResumeTheme;
  targetRole?: string;
  onSkillAdd: (skill: string) => void;
}

// Industry skill recommendations database
const industrySkills = {
  'software-engineer': ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'Git', 'REST APIs', 'GraphQL'],
  'data-analyst': ['SQL', 'Python', 'Tableau', 'Power BI', 'Excel', 'R', 'Statistics', 'Machine Learning'],
  'marketing': ['Google Analytics', 'SEO', 'Content Marketing', 'Social Media', 'A/B Testing', 'CRM'],
  'designer': ['Figma', 'Adobe Creative Suite', 'Sketch', 'Prototyping', 'User Research', 'Design Systems'],
  'product-manager': ['Agile', 'Scrum', 'Product Strategy', 'User Research', 'Analytics', 'Roadmapping'],
  'finance': ['Financial Modeling', 'Excel', 'SQL', 'Risk Analysis', 'Budgeting', 'Forecasting'],
  'sales': ['CRM', 'Lead Generation', 'Negotiation', 'Pipeline Management', 'Customer Relationship'],
  'hr': ['Recruitment', 'Employee Relations', 'Performance Management', 'HRIS', 'Training & Development']
};

// ATS keywords by industry
const atsKeywords = {
  'software-engineer': ['Full-Stack Development', 'Agile Methodology', 'CI/CD', 'Cloud Computing', 'API Development'],
  'data-analyst': ['Data Visualization', 'Business Intelligence', 'Predictive Analytics', 'Database Management'],
  'marketing': ['Digital Marketing', 'Brand Management', 'Campaign Optimization', 'Marketing Automation'],
  'designer': ['User Experience', 'Visual Design', 'Design Thinking', 'Responsive Design'],
  'product-manager': ['Product Development', 'Market Research', 'Stakeholder Management', 'Feature Prioritization'],
  'finance': ['Financial Analysis', 'Budget Planning', 'Investment Analysis', 'Financial Reporting'],
  'sales': ['Sales Strategy', 'Account Management', 'Revenue Growth', 'Client Acquisition'],
  'hr': ['Talent Acquisition', 'Organizational Development', 'Compensation & Benefits', 'Employee Engagement']
};

const detectIndustryFromData = (data: ResumeData): string => {
  const allText = [
    data.personalInfo.tagline,
    data.personalInfo.objective,
    ...data.skills,
    ...data.experience.map(exp => `${exp.role} ${exp.company} ${exp.achievements.join(' ')}`),
    ...data.education.map(edu => edu.degree)
  ].join(' ').toLowerCase();

  // Simple keyword matching for industry detection
  if (/software|developer|engineer|programming|react|javascript|python|code/.test(allText)) {
    return 'software-engineer';
  }
  if (/data|analyst|analytics|sql|tableau|statistics|machine learning/.test(allText)) {
    return 'data-analyst';
  }
  if (/marketing|seo|campaign|brand|digital|social media/.test(allText)) {
    return 'marketing';
  }
  if (/design|ui|ux|visual|creative|figma|adobe/.test(allText)) {
    return 'designer';
  }
  if (/product|manager|strategy|roadmap|agile|scrum/.test(allText)) {
    return 'product-manager';
  }
  if (/finance|financial|accounting|budget|investment/.test(allText)) {
    return 'finance';
  }
  if (/sales|account|revenue|client|customer/.test(allText)) {
    return 'sales';
  }
  if (/hr|human resources|recruitment|talent|employee/.test(allText)) {
    return 'hr';
  }
  
  return 'software-engineer'; // Default fallback
};

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ 
  resumeData, 
  selectedTheme,
  targetRole,
  onSkillAdd 
}) => {
  const detectedIndustry = detectIndustryFromData(resumeData);
  const recommendedSkills = industrySkills[detectedIndustry as keyof typeof industrySkills] || [];
  const keywords = atsKeywords[detectedIndustry as keyof typeof atsKeywords] || [];
  
  // Analyze missing skills
  const missingSkills = recommendedSkills.filter(skill => 
    !resumeData.skills.some(userSkill => 
      userSkill.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(userSkill.toLowerCase())
    )
  );

  // Generate resume improvement suggestions
  const getResumeImprovements = () => {
    const improvements = [];
    
    if (!resumeData.personalInfo.objective || resumeData.personalInfo.objective.length < 50) {
      improvements.push("Make your objective more specific and highlight your unique value proposition");
    }
    
    if (resumeData.experience.length === 0) {
      improvements.push("Add work experience with quantifiable achievements");
    } else {
      const hasMetrics = resumeData.experience.some(exp => 
        exp.achievements.some(ach => /\d+/.test(ach))
      );
      if (!hasMetrics) {
        improvements.push("Add specific metrics and numbers to your achievements (e.g., 'Improved efficiency by 30%')");
      }
    }
    
    if (resumeData.skills.length < 5) {
      improvements.push("Add more relevant skills to strengthen your profile");
    }
    
    if (!resumeData.personalInfo.linkedIn) {
      improvements.push("Add your LinkedIn profile to increase professional credibility");
    }
    
    return improvements;
  };

  // Theme fit analysis
  const getThemeFitAnalysis = () => {
    const themeIndustryMatch = {
      'software-engineer': ['modern', 'minimal', 'dark'],
      'data-analyst': ['corporate', 'minimal', 'modern'],
      'marketing': ['creative', 'modern', 'infographic'],
      'designer': ['creative', 'infographic', 'modern'],
      'product-manager': ['modern', 'corporate', 'minimal'],
      'finance': ['corporate', 'minimal', 'dark'],
      'sales': ['corporate', 'modern', 'creative'],
      'hr': ['corporate', 'minimal', 'modern']
    };
    
    const recommendedCategories = themeIndustryMatch[detectedIndustry as keyof typeof themeIndustryMatch] || ['minimal'];
    const isGoodMatch = recommendedCategories.includes(selectedTheme.category);
    
    return {
      isGoodMatch,
      recommendation: isGoodMatch 
        ? `${selectedTheme.name} is an excellent choice for ${detectedIndustry.replace('-', ' ')} roles`
        : `Consider a ${recommendedCategories[0]} theme for better industry alignment`
    };
  };

  const improvements = getResumeImprovements();
  const themeFit = getThemeFitAnalysis();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          AI-Powered Insights
        </h2>
        <p className="text-muted-foreground">
          Personalized recommendations to maximize your resume's impact
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resume Improvements */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Resume Improvements
            </CardTitle>
            <CardDescription>
              AI-analyzed suggestions to strengthen your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gradient-secondary rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{improvement}</span>
                </div>
              ))}
              {improvements.length === 0 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-green-700">Great job! Your resume covers all key areas.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skill Gap Analysis */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Skill Gap Analysis
            </CardTitle>
            <CardDescription>
              Skills to learn for {detectedIndustry.replace('-', ' ')} roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {missingSkills.slice(0, 6).map((skill, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gradient-secondary rounded">
                  <span className="text-sm font-medium">{skill}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onSkillAdd(skill)}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
              ))}
              {missingSkills.length === 0 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-green-700">Excellent! You have all key skills for your industry.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ATS Keywords */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              ATS Optimization
            </CardTitle>
            <CardDescription>
              Keywords to improve your ATS ranking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Include these keywords naturally in your experience descriptions and skills.
            </p>
          </CardContent>
        </Card>

        {/* Theme Fit Analysis */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Theme Analysis
            </CardTitle>
            <CardDescription>
              How well your theme fits your industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`flex items-start gap-3 p-3 rounded-lg ${
              themeFit.isGoodMatch ? 'bg-green-50' : 'bg-orange-50'
            }`}>
              {themeFit.isGoodMatch ? (
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              )}
              <span className={`text-sm ${themeFit.isGoodMatch ? 'text-green-700' : 'text-orange-700'}`}>
                {themeFit.recommendation}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tailoring Tips */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Industry Tailoring Tips
          </CardTitle>
          <CardDescription>
            Specific advice for {detectedIndustry.replace('-', ' ')} applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Action Words to Use
              </h4>
              <div className="flex flex-wrap gap-1">
                {['Developed', 'Implemented', 'Optimized', 'Led', 'Designed', 'Improved'].map((word, index) => (
                  <Badge key={index} variant="outline" className="text-xs">{word}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Pro Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Quantify achievements with specific metrics</li>
                <li>• Use industry-specific terminology</li>
                <li>• Highlight relevant certifications</li>
                <li>• Include links to portfolio/projects</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};