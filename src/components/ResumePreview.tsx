import React from 'react';
import { ResumeData } from './ResumeBuilder';
import { Mail, Phone, Linkedin, Github, MapPin } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  template: 'modern' | 'professional' | 'creative';
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ data, template }) => {
  const { personalInfo, skills, experience, education, certifications } = data;

  const ModernTemplate = () => (
    <div className="max-w-4xl mx-auto bg-white shadow-strong rounded-lg overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-primary text-white p-8">
        <div className="flex items-center gap-6">
          {personalInfo.profilePicture && (
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20">
              <img 
                src={personalInfo.profilePicture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{personalInfo.fullName || 'Your Name'}</h1>
            <p className="text-xl text-white/90 mb-4">{personalInfo.tagline || 'Your Professional Tagline'}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {personalInfo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{personalInfo.email}</span>
                </div>
              )}
              {personalInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{personalInfo.phone}</span>
                </div>
              )}
              {personalInfo.linkedIn && (
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  <span>{personalInfo.linkedIn}</span>
                </div>
              )}
              {personalInfo.github && (
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  <span>{personalInfo.github}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Objective */}
        {personalInfo.objective && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-professional border-b-2 border-primary pb-2 mb-4">
              Professional Summary
            </h2>
            <p className="text-text-muted leading-relaxed">{personalInfo.objective}</p>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-professional border-b-2 border-primary pb-2 mb-4">
              Core Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span 
                  key={index}
                  className="bg-gradient-primary text-white px-3 py-1 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-professional border-b-2 border-primary pb-2 mb-4">
              Professional Experience
            </h2>
            <div className="space-y-6">
              {experience.map((exp, index) => (
                <div key={index} className="border-l-4 border-primary pl-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-professional">{exp.role}</h3>
                      <p className="text-lg text-primary font-medium">{exp.company}</p>
                    </div>
                    <span className="text-text-muted font-medium">{exp.duration}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-text-muted">
                    {exp.achievements.filter(ach => ach.trim()).map((achievement, achIndex) => (
                      <li key={achIndex}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-professional border-b-2 border-primary pb-2 mb-4">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-professional">{edu.degree}</h3>
                    <p className="text-primary font-medium">{edu.institution}</p>
                  </div>
                  <span className="text-text-muted font-medium">{edu.year}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-professional border-b-2 border-primary pb-2 mb-4">
              Certifications & Projects
            </h2>
            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-professional">{cert.name}</h3>
                    <p className="text-primary font-medium">{cert.issuer}</p>
                  </div>
                  <span className="text-text-muted font-medium">{cert.year}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );

  const ProfessionalTemplate = () => (
    <div className="max-w-4xl mx-auto bg-white shadow-strong rounded-lg overflow-hidden">
      {/* Header Section */}
      <div className="bg-slate-800 text-white p-8">
        <div className="text-center">
          {personalInfo.profilePicture && (
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 mx-auto mb-4">
              <img 
                src={personalInfo.profilePicture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-4xl font-bold mb-2">{personalInfo.fullName || 'Your Name'}</h1>
          <p className="text-xl text-slate-200 mb-4">{personalInfo.tagline || 'Your Professional Tagline'}</p>
          <div className="flex justify-center flex-wrap gap-6 text-sm">
            {personalInfo.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{personalInfo.email}</span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.linkedIn && (
              <div className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                <span>{personalInfo.linkedIn}</span>
              </div>
            )}
            {personalInfo.github && (
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                <span>{personalInfo.github}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Objective */}
        {personalInfo.objective && (
          <section className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Professional Summary
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl mx-auto">{personalInfo.objective}</p>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-8">
            {/* Skills */}
            {skills.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-300 pb-2">
                  Core Skills
                </h2>
                <div className="space-y-2">
                  {skills.map((skill, index) => (
                    <div key={index} className="bg-slate-100 px-3 py-2 rounded text-sm font-medium text-slate-700">
                      {skill}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {education.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-300 pb-2">
                  Education
                </h2>
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-slate-800">{edu.degree}</h3>
                      <p className="text-slate-600 text-sm">{edu.institution}</p>
                      <p className="text-slate-500 text-xs">{edu.year}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-300 pb-2">
                  Certifications
                </h2>
                <div className="space-y-4">
                  {certifications.map((cert, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-slate-800 text-sm">{cert.name}</h3>
                      <p className="text-slate-600 text-xs">{cert.issuer}</p>
                      <p className="text-slate-500 text-xs">{cert.year}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            {/* Experience */}
            {experience.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-300 pb-2">
                  Professional Experience
                </h2>
                <div className="space-y-6">
                  {experience.map((exp, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">{exp.role}</h3>
                          <p className="text-slate-600 font-medium">{exp.company}</p>
                        </div>
                        <span className="text-slate-500 text-sm font-medium">{exp.duration}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                        {exp.achievements.filter(ach => ach.trim()).map((achievement, achIndex) => (
                          <li key={achIndex}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const CreativeTemplate = () => (
    <div className="max-w-4xl mx-auto bg-white shadow-strong rounded-2xl overflow-hidden">
      {/* Creative Header */}
      <div className="relative bg-gradient-accent text-white p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-8">
            {personalInfo.profilePicture && (
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white/30 shadow-lg">
                <img 
                  src={personalInfo.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-3 leading-tight">{personalInfo.fullName || 'Your Name'}</h1>
              <p className="text-2xl text-white/90 mb-6">{personalInfo.tagline || 'Your Professional Tagline'}</p>
              <div className="flex flex-wrap gap-4">
                {personalInfo.email && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{personalInfo.email}</span>
                  </div>
                )}
                {personalInfo.phone && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{personalInfo.phone}</span>
                  </div>
                )}
                {personalInfo.linkedIn && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm">{personalInfo.linkedIn}</span>
                  </div>
                )}
                {personalInfo.github && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Github className="w-4 h-4" />
                    <span className="text-sm">{personalInfo.github}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Objective */}
        {personalInfo.objective && (
          <section className="mb-8">
            <div className="bg-gradient-secondary p-6 rounded-2xl">
              <h2 className="text-2xl font-bold text-professional mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg"></div>
                Professional Summary
              </h2>
              <p className="text-text-muted leading-relaxed">{personalInfo.objective}</p>
            </div>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-professional mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg"></div>
              Core Skills
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {skills.map((skill, index) => (
                <div 
                  key={index}
                  className="bg-gradient-primary text-white px-4 py-3 rounded-xl text-center font-medium shadow-soft hover:shadow-medium transition-all duration-300"
                >
                  {skill}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-professional mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg"></div>
              Professional Experience
            </h2>
            <div className="space-y-6">
              {experience.map((exp, index) => (
                <div key={index} className="bg-gradient-secondary p-6 rounded-2xl border-l-4 border-primary">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-professional">{exp.role}</h3>
                      <p className="text-lg text-primary font-semibold">{exp.company}</p>
                    </div>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {exp.duration}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {exp.achievements.filter(ach => ach.trim()).map((achievement, achIndex) => (
                      <li key={achIndex} className="flex items-start gap-3 text-text-muted">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Education */}
          {education.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-professional mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg"></div>
                Education
              </h2>
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <div key={index} className="bg-gradient-secondary p-4 rounded-xl">
                    <h3 className="text-lg font-semibold text-professional">{edu.degree}</h3>
                    <p className="text-primary font-medium">{edu.institution}</p>
                    <p className="text-text-muted text-sm">{edu.year}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-professional mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg"></div>
                Certifications
              </h2>
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="bg-gradient-secondary p-4 rounded-xl">
                    <h3 className="text-lg font-semibold text-professional">{cert.name}</h3>
                    <p className="text-primary font-medium">{cert.issuer}</p>
                    <p className="text-text-muted text-sm">{cert.year}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="container mx-auto">
        {/* Template Selection */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-professional mb-4">Choose Your Template</h2>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {}}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                template === 'modern' 
                  ? 'bg-gradient-primary text-white shadow-medium' 
                  : 'bg-white text-professional shadow-soft hover:shadow-medium'
              }`}
            >
              Modern
            </button>
            <button
              onClick={() => {}}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                template === 'professional' 
                  ? 'bg-gradient-primary text-white shadow-medium' 
                  : 'bg-white text-professional shadow-soft hover:shadow-medium'
              }`}
            >
              Professional
            </button>
            <button
              onClick={() => {}}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                template === 'creative' 
                  ? 'bg-gradient-primary text-white shadow-medium' 
                  : 'bg-white text-professional shadow-soft hover:shadow-medium'
              }`}
            >
              Creative
            </button>
          </div>
        </div>

        {/* Resume Preview - Only one template is rendered at a time, so ID is unique */}
        <div id="resume-preview-element">
          {template === 'modern' && <ModernTemplate />}
          {template === 'professional' && <ProfessionalTemplate />}
          {template === 'creative' && <CreativeTemplate />}
        </div>

        {/* ATS Keywords Suggestion */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-2xl shadow-medium">
            <h3 className="text-xl font-bold text-professional mb-4">🎯 ATS Optimization Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-professional mb-2">Suggested Keywords:</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 5).map((skill, index) => (
                    <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-professional mb-2">Pro Tips:</h4>
                <ul className="text-sm text-text-muted space-y-1">
                  <li>• Use action verbs in achievements</li>
                  <li>• Include relevant industry keywords</li>
                  <li>• Keep formatting simple and clean</li>
                  <li>• Use standard section headings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};