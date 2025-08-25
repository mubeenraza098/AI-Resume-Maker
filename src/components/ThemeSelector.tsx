import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Palette, Layout, Sparkles, Eye } from 'lucide-react';

export interface ResumeTheme {
  id: string;
  name: string;
  category: 'minimal' | 'corporate' | 'creative' | 'modern' | 'dark' | 'infographic';
  description: string;
  primaryColor: string;
  secondaryColor: string;
  layout: 'single-column' | 'two-column' | 'sidebar' | 'header-focused';
  preview: {
    headerBg: string;
    textColor: string;
    accentColor: string;
    sectionBg: string;
  };
}

export const resumeThemes: ResumeTheme[] = [
  // Minimal Themes
  {
    id: 'minimal-clean',
    name: 'Clean Minimal',
    category: 'minimal',
    description: 'Pure white background with black text and blue accents',
    primaryColor: 'hsl(221, 83%, 53%)',
    secondaryColor: 'hsl(0, 0%, 0%)',
    layout: 'single-column',
    preview: { headerBg: 'bg-white', textColor: 'text-slate-900', accentColor: 'bg-blue-500', sectionBg: 'bg-gray-50' }
  },
  {
    id: 'minimal-elegant',
    name: 'Elegant Gray',
    category: 'minimal',
    description: 'Light gray background with navy text and subtle accents',
    primaryColor: 'hsl(210, 100%, 20%)',
    secondaryColor: 'hsl(0, 0%, 95%)',
    layout: 'single-column',
    preview: { headerBg: 'bg-gray-100', textColor: 'text-navy-900', accentColor: 'bg-navy-600', sectionBg: 'bg-white' }
  },
  {
    id: 'minimal-modern',
    name: 'Modern Minimal',
    category: 'minimal',
    description: 'Contemporary design with subtle shadows and clean typography',
    primaryColor: 'hsl(200, 100%, 40%)',
    secondaryColor: 'hsl(0, 0%, 98%)',
    layout: 'single-column',
    preview: { headerBg: 'bg-slate-50', textColor: 'text-slate-800', accentColor: 'bg-sky-500', sectionBg: 'bg-white' }
  },

  // Corporate Themes
  {
    id: 'corporate-navy',
    name: 'Corporate Navy',
    category: 'corporate',
    description: 'Professional navy sidebar with white content area',
    primaryColor: 'hsl(210, 100%, 25%)',
    secondaryColor: 'hsl(0, 0%, 100%)',
    layout: 'sidebar',
    preview: { headerBg: 'bg-navy-800', textColor: 'text-white', accentColor: 'bg-gold-400', sectionBg: 'bg-white' }
  },
  {
    id: 'corporate-burgundy',
    name: 'Executive Burgundy',
    category: 'corporate',
    description: 'Sophisticated burgundy headers with cream body',
    primaryColor: 'hsl(345, 63%, 35%)',
    secondaryColor: 'hsl(45, 45%, 95%)',
    layout: 'header-focused',
    preview: { headerBg: 'bg-burgundy-700', textColor: 'text-white', accentColor: 'bg-gold-500', sectionBg: 'bg-cream-50' }
  },
  {
    id: 'corporate-forest',
    name: 'Forest Professional',
    category: 'corporate',
    description: 'Forest green headers with beige background',
    primaryColor: 'hsl(140, 60%, 25%)',
    secondaryColor: 'hsl(45, 30%, 92%)',
    layout: 'two-column',
    preview: { headerBg: 'bg-forest-700', textColor: 'text-white', accentColor: 'bg-forest-500', sectionBg: 'bg-beige-50' }
  },

  // Creative Themes
  {
    id: 'creative-gradient-purple',
    name: 'Purple Gradient',
    category: 'creative',
    description: 'Purple to pink gradient header with modern design',
    primaryColor: 'hsl(270, 70%, 50%)',
    secondaryColor: 'hsl(315, 70%, 60%)',
    layout: 'header-focused',
    preview: { headerBg: 'bg-gradient-to-r from-purple-600 to-pink-500', textColor: 'text-white', accentColor: 'bg-purple-500', sectionBg: 'bg-purple-50' }
  },
  {
    id: 'creative-teal-orange',
    name: 'Teal & Orange',
    category: 'creative',
    description: 'Vibrant teal and orange color combination',
    primaryColor: 'hsl(180, 70%, 40%)',
    secondaryColor: 'hsl(25, 85%, 55%)',
    layout: 'sidebar',
    preview: { headerBg: 'bg-teal-600', textColor: 'text-white', accentColor: 'bg-orange-500', sectionBg: 'bg-teal-50' }
  },
  {
    id: 'creative-sunset',
    name: 'Sunset Vibes',
    category: 'creative',
    description: 'Warm sunset gradient with creative layouts',
    primaryColor: 'hsl(15, 85%, 55%)',
    secondaryColor: 'hsl(45, 90%, 60%)',
    layout: 'header-focused',
    preview: { headerBg: 'bg-gradient-to-r from-orange-500 to-yellow-400', textColor: 'text-white', accentColor: 'bg-orange-500', sectionBg: 'bg-orange-50' }
  },

  // Modern Tech Themes
  {
    id: 'modern-tech-blue',
    name: 'Tech Blue',
    category: 'modern',
    description: 'Modern tech design with electric blue accents',
    primaryColor: 'hsl(200, 100%, 50%)',
    secondaryColor: 'hsl(210, 20%, 98%)',
    layout: 'two-column',
    preview: { headerBg: 'bg-sky-600', textColor: 'text-white', accentColor: 'bg-sky-400', sectionBg: 'bg-sky-50' }
  },
  {
    id: 'modern-emerald',
    name: 'Emerald Modern',
    category: 'modern',
    description: 'Contemporary emerald design with clean lines',
    primaryColor: 'hsl(160, 85%, 40%)',
    secondaryColor: 'hsl(160, 20%, 97%)',
    layout: 'sidebar',
    preview: { headerBg: 'bg-emerald-600', textColor: 'text-white', accentColor: 'bg-emerald-400', sectionBg: 'bg-emerald-50' }
  },
  {
    id: 'modern-violet',
    name: 'Violet Tech',
    category: 'modern',
    description: 'Futuristic violet theme with modern typography',
    primaryColor: 'hsl(260, 70%, 55%)',
    secondaryColor: 'hsl(260, 25%, 97%)',
    layout: 'header-focused',
    preview: { headerBg: 'bg-violet-600', textColor: 'text-white', accentColor: 'bg-violet-400', sectionBg: 'bg-violet-50' }
  },

  // Dark Mode Themes
  {
    id: 'dark-professional',
    name: 'Dark Professional',
    category: 'dark',
    description: 'Dark mode with blue accents for modern professionals',
    primaryColor: 'hsl(215, 25%, 15%)',
    secondaryColor: 'hsl(210, 100%, 60%)',
    layout: 'single-column',
    preview: { headerBg: 'bg-slate-800', textColor: 'text-white', accentColor: 'bg-blue-500', sectionBg: 'bg-slate-700' }
  },
  {
    id: 'dark-creative',
    name: 'Dark Creative',
    category: 'dark',
    description: 'Dark theme with neon green highlights',
    primaryColor: 'hsl(220, 20%, 12%)',
    secondaryColor: 'hsl(120, 80%, 50%)',
    layout: 'sidebar',
    preview: { headerBg: 'bg-slate-900', textColor: 'text-white', accentColor: 'bg-green-400', sectionBg: 'bg-slate-800' }
  },
  {
    id: 'dark-executive',
    name: 'Dark Executive',
    category: 'dark',
    description: 'Premium dark theme with gold accents',
    primaryColor: 'hsl(210, 25%, 10%)',
    secondaryColor: 'hsl(45, 85%, 55%)',
    layout: 'two-column',
    preview: { headerBg: 'bg-gray-900', textColor: 'text-white', accentColor: 'bg-yellow-500', sectionBg: 'bg-gray-800' }
  },

  // Infographic Themes
  {
    id: 'infographic-colorful',
    name: 'Colorful Infographic',
    category: 'infographic',
    description: 'Icon-rich design with colorful sections',
    primaryColor: 'hsl(200, 100%, 45%)',
    secondaryColor: 'hsl(280, 70%, 55%)',
    layout: 'two-column',
    preview: { headerBg: 'bg-gradient-to-r from-blue-500 to-purple-600', textColor: 'text-white', accentColor: 'bg-blue-500', sectionBg: 'bg-blue-50' }
  },
  {
    id: 'infographic-minimalist',
    name: 'Minimalist Icons',
    category: 'infographic',
    description: 'Clean infographic style with subtle icons',
    primaryColor: 'hsl(210, 50%, 35%)',
    secondaryColor: 'hsl(210, 15%, 95%)',
    layout: 'sidebar',
    preview: { headerBg: 'bg-slate-600', textColor: 'text-white', accentColor: 'bg-slate-400', sectionBg: 'bg-slate-50' }
  }
];

interface ThemeSelectorProps {
  selectedTheme: ResumeTheme | null;
  onThemeSelect: (theme: ResumeTheme) => void;
  onContinue: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  selectedTheme, 
  onThemeSelect, 
  onContinue 
}) => {
  const categories = [
    { key: 'minimal', label: 'Minimal', icon: Layout, description: 'Clean and simple designs' },
    { key: 'corporate', label: 'Corporate', icon: Palette, description: 'Professional business themes' },
    { key: 'creative', label: 'Creative', icon: Sparkles, description: 'Bold and artistic designs' },
    { key: 'modern', label: 'Modern Tech', icon: Eye, description: 'Contemporary technology themes' },
    { key: 'dark', label: 'Dark Mode', icon: Layout, description: 'Dark background themes' },
    { key: 'infographic', label: 'Infographic', icon: Sparkles, description: 'Icon-rich visual designs' }
  ] as const;

  const scrollToCategory = (categoryKey: string) => {
    const element = document.getElementById(`${categoryKey}-grid`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-secondary">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Choose Your Resume Theme
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Select from 100+ professional themes designed for different industries and roles. 
            Your choice will determine the visual style of your resume.
          </p>
        </div>

        {/* Category Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 max-w-6xl mx-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.key} 
                className="text-center hover:shadow-medium transition-all cursor-pointer"
                onClick={() => scrollToCategory(category.key)}
              >
                <CardContent className="p-4">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold text-sm">{category.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Theme Grid by Category */}
        {categories.map((category) => {
          const categoryThemes = resumeThemes.filter(theme => theme.category === category.key);
          
          return (
            <div key={category.key} id={`${category.key}-grid`} className="mb-12">
              <h2 className="text-2xl font-semibold text-center mb-6 text-foreground">
                {category.label} Themes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {categoryThemes.map((theme) => (
                  <Card 
                    key={theme.id} 
                    className={`cursor-pointer transition-all hover:shadow-medium ${
                      selectedTheme?.id === theme.id 
                        ? 'ring-2 ring-primary shadow-medium' 
                        : 'hover:ring-1 hover:ring-primary/30'
                    }`}
                    onClick={() => onThemeSelect(theme)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{theme.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {theme.category}
                          </Badge>
                        </div>
                        {selectedTheme?.id === theme.id && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {theme.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Theme Preview */}
                      <div className="space-y-2">
                        <div className={`h-8 rounded-t ${theme.preview.headerBg} flex items-center px-2`}>
                          <div className="w-4 h-4 bg-white/20 rounded-full mr-2"></div>
                          <div className="h-2 bg-white/30 rounded flex-1 max-w-16"></div>
                        </div>
                        <div className={`${theme.preview.sectionBg} p-2 rounded-b space-y-1`}>
                          <div className="flex gap-1">
                            <div className={`h-1 ${theme.preview.accentColor} rounded flex-1 max-w-8`}></div>
                            <div className={`h-1 ${theme.preview.accentColor} rounded flex-1 max-w-6`}></div>
                          </div>
                          <div className="space-y-1">
                            <div className="h-1 bg-gray-300 rounded max-w-full"></div>
                            <div className="h-1 bg-gray-200 rounded max-w-3/4"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Layout Info */}
                      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                        <span>Layout: {theme.layout.replace('-', ' ')}</span>
                        <span>• ATS Friendly</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
        
        <div className="mb-8"></div>

        {/* Continue Button */}
        <div className="text-center">
          <Button 
            onClick={onContinue}
            disabled={!selectedTheme}
            size="lg"
            className="gap-2 bg-gradient-primary hover:bg-primary-hover px-8"
          >
            Continue with {selectedTheme?.name || 'Selected Theme'}
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};