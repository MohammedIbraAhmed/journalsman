/**
 * Anonymous Review Form Page
 * 
 * This page provides journal-specific review forms with customizable criteria
 * and evaluation templates. Forms are dynamically generated based on journal
 * requirements while maintaining reviewer anonymity.
 */

import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Star,
  MessageSquare,
  Save,
  Send,
  ArrowLeft
} from 'lucide-react';
import { ReviewFormBuilder } from '@/components/review/review-form-builder';
import { ReviewFormValidator } from '@/components/review/review-form-validator';

export const metadata: Metadata = {
  title: 'Review Form | Anonymous Peer Review',
  description: 'Journal-specific review evaluation form with anonymous submission',
};

/**
 * Review form progress indicator
 */
function ReviewFormProgress({ 
  completedSections, 
  totalSections, 
  requiredSections 
}: {
  completedSections: number;
  totalSections: number;
  requiredSections: number;
}) {
  const progress = (completedSections / totalSections) * 100;
  const requiredProgress = (Math.min(completedSections, requiredSections) / requiredSections) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span>Form Completion</span>
        <span className="font-medium">
          {completedSections}/{totalSections} sections
        </span>
      </div>
      
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall Progress: {Math.round(progress)}%</span>
          <span>Required: {Math.round(requiredProgress)}%</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Badge variant={completedSections >= requiredSections ? 'default' : 'secondary'}>
          {completedSections >= requiredSections ? 
            <CheckCircle className="h-3 w-3 mr-1" /> : 
            <AlertCircle className="h-3 w-3 mr-1" />
          }
          {completedSections >= requiredSections ? 'Ready to Submit' : 'Missing Required Fields'}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Review form sidebar with sections
 */
function ReviewFormSidebar({ 
  sections, 
  currentSection, 
  completedSections,
  onSectionChange 
}: {
  sections: Array<{
    id: string;
    title: string;
    required: boolean;
    completed: boolean;
    hasError?: boolean;
  }>;
  currentSection: string;
  completedSections: number;
  onSectionChange: (sectionId: string) => void;
}) {
  return (
    <Card className="w-64 h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Review Form Sections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ReviewFormProgress
          completedSections={completedSections}
          totalSections={sections.length}
          requiredSections={sections.filter(s => s.required).length}
        />
        
        <Separator />
        
        <div className="space-y-1">
          {sections.map((section, index) => (
            <Button
              key={section.id}
              variant={currentSection === section.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onSectionChange(section.id)}
              className="w-full justify-start text-left h-auto py-2 px-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-muted px-1 rounded">
                    {index + 1}
                  </span>
                  <span className="text-xs">{section.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  {section.required && (
                    <Star className="h-3 w-3 text-orange-500" />
                  )}
                  {section.completed ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : section.hasError ? (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  ) : (
                    <div className="h-3 w-3 border border-muted-foreground rounded-full" />
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        <Separator />
        
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Star className="h-3 w-3 text-orange-500" />
            <span>Required section</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <span>Has validation errors</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Form action buttons
 */
function ReviewFormActions({
  canSubmit,
  onSaveDraft,
  onSubmit,
  onGoBack,
  isSaving,
  isSubmitting,
}: {
  canSubmit: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onGoBack: () => void;
  isSaving?: boolean;
  isSubmitting?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Manuscript
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onSaveDraft}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            
            <Button
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-muted-foreground text-center">
          {canSubmit ? (
            'Your review is ready for submission'
          ) : (
            'Please complete all required sections before submitting'
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main review form page
 */
export default async function ReviewFormPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  
  // Get anonymous context from headers
  const headersList = await headers();
  const anonymousId = headersList.get('X-Anonymous-Id');
  
  if (!anonymousId) {
    return (
      <div className="text-center py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Anonymous Session Required
            </h2>
            <p className="text-muted-foreground text-sm">
              You need a valid anonymous reviewer session to access this review form.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // TODO: Fetch journal-specific form template and saved data
  // const { formTemplate, savedData } = await getReviewFormData(anonymousId, reviewId);
  
  // Mock data for demonstration
  const manuscriptTitle = "Advanced Machine Learning Techniques for Climate Change Prediction";
  const journalName = "Climate Science & Technology";
  
  // Mock form sections - would be loaded from journal configuration
  const formSections = [
    {
      id: 'significance',
      title: 'Scientific Significance',
      required: true,
      completed: false,
      description: 'Evaluate the novelty and importance of the research contribution'
    },
    {
      id: 'methodology',
      title: 'Methodology Assessment',
      required: true,
      completed: false,
      description: 'Review the experimental design and analytical approaches'
    },
    {
      id: 'results',
      title: 'Results Evaluation',
      required: true,
      completed: false,
      description: 'Assess the quality and interpretation of results'
    },
    {
      id: 'presentation',
      title: 'Presentation Quality',
      required: true,
      completed: false,
      description: 'Evaluate writing quality, clarity, and organization'
    },
    {
      id: 'recommendation',
      title: 'Final Recommendation',
      required: true,
      completed: false,
      description: 'Provide your overall assessment and recommendation'
    },
    {
      id: 'confidential',
      title: 'Confidential Comments',
      required: false,
      completed: false,
      description: 'Comments for editors only (not shared with authors)'
    },
  ];

  const completedSections = formSections.filter(s => s.completed).length;
  const canSubmit = formSections.filter(s => s.required).every(s => s.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">
                Review Evaluation Form
              </CardTitle>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div><strong>Manuscript:</strong> {manuscriptTitle}</div>
                <div><strong>Journal:</strong> {journalName}</div>
                <div><strong>Review ID:</strong> {reviewId}</div>
                <div><strong>Anonymous ID:</strong> {anonymousId.substring(0, 12)}...</div>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0">
              Anonymous Review
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Main form interface */}
      <div className="flex gap-6">
        {/* Form sidebar */}
        <aside className="hidden lg:block">
          <ReviewFormSidebar
            sections={formSections}
            currentSection={formSections[0].id}
            completedSections={completedSections}
            onSectionChange={(sectionId) => {
              // Handle section navigation
              console.log('Navigate to section:', sectionId);
            }}
          />
        </aside>

        {/* Form content */}
        <main className="flex-1">
          <Card className="min-h-[600px]">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Review Form
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Auto-saved • Last saved: 2 minutes ago
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <ScrollArea className="h-[500px]">
                <ReviewFormBuilder
                  sections={formSections}
                  journalId="climate-science-tech"
                  anonymousId={anonymousId}
                  onSectionComplete={(sectionId) => {
                    console.log('Section completed:', sectionId);
                  }}
                  onFormChange={(data) => {
                    console.log('Form data changed:', data);
                  }}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Mobile section navigation */}
      <div className="lg:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Form Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {formSections.map((section, index) => (
                <Button
                  key={section.id}
                  variant="outline"
                  size="sm"
                  className="h-auto p-2 flex flex-col gap-1"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{index + 1}.</span>
                    {section.required && <Star className="h-3 w-3 text-orange-500" />}
                    {section.completed && <CheckCircle className="h-3 w-3 text-green-500" />}
                  </div>
                  <span className="text-xs text-center leading-tight">
                    {section.title}
                  </span>
                </Button>
              ))}
            </div>
            <div className="mt-3">
              <ReviewFormProgress
                completedSections={completedSections}
                totalSections={formSections.length}
                requiredSections={formSections.filter(s => s.required).length}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form actions */}
      <ReviewFormActions
        canSubmit={canSubmit}
        onSaveDraft={() => console.log('Save draft')}
        onSubmit={() => console.log('Submit review')}
        onGoBack={() => window.history.back()}
      />
    </div>
  );
}