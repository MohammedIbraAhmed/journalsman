'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import type { 
  SubmissionWizardConfig, 
  ManuscriptSubmission, 
  SubmissionStep,
  WizardStep 
} from '@shared/types';
import { ManuscriptUploadStep } from './steps/ManuscriptUploadStep';
import { AuthorDetailsStep } from './steps/AuthorDetailsStep';
import { ManuscriptDetailsStep } from './steps/ManuscriptDetailsStep';
import { SupplementaryFilesStep } from './steps/SupplementaryFilesStep';
import { DeclarationsStep } from './steps/DeclarationsStep';
import { ReviewSubmitStep } from './steps/ReviewSubmitStep';
import { ProgressIndicator } from './wizard/ProgressIndicator';
import { NavigationControls } from './wizard/NavigationControls';
import { AutoSaveIndicator } from './wizard/AutoSaveIndicator';
import { HelpPanel } from './wizard/HelpPanel';

interface SubmissionWizardProps {
  journalId: string;
}

export default function SubmissionWizard({ journalId }: SubmissionWizardProps) {
  const [currentStep, setCurrentStep] = useState<SubmissionStep>('manuscript-upload');
  const [submission, setSubmission] = useState<Partial<ManuscriptSubmission> | null>(null);
  const [wizardConfig, setWizardConfig] = useState<SubmissionWizardConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<SubmissionStep>>(new Set());

  // Load wizard configuration
  const { data: config, isLoading: configLoading, error: configError } = trpc.submission.getWizardConfig.useQuery({ 
    journalId 
  });

  // Auto-save draft mutation
  const updateDraftMutation = trpc.submission.updateDraft.useMutation({
    onSuccess: (result) => {
      setLastSaved(result.lastSaved);
      setIsDraftSaving(false);
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
      setIsDraftSaving(false);
    }
  });

  // Track submission events
  const trackEventMutation = trpc.submission.trackEvent.useMutation();

  useEffect(() => {
    if (config) {
      setWizardConfig(config);
      setIsLoading(false);
    } else if (configError) {
      // Handle error case - stop loading to show error UI
      setIsLoading(false);
    }
  }, [config, configError]);

  // Auto-save functionality
  const autoSave = useCallback(async (stepData: any, step: SubmissionStep) => {
    if (!submission?.id || !wizardConfig?.settings.allowDraftSaving) return;

    setIsDraftSaving(true);
    try {
      await updateDraftMutation.mutateAsync({
        submissionId: submission.id,
        step,
        data: stepData,
        autoSave: true
      });
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [submission?.id, wizardConfig?.settings.allowDraftSaving, updateDraftMutation]);

  // Set up auto-save interval
  useEffect(() => {
    if (!wizardConfig?.settings.autoSaveInterval) return;

    const interval = setInterval(() => {
      if (submission && !isDraftSaving) {
        const currentStepData = getCurrentStepData();
        if (currentStepData) {
          autoSave(currentStepData, currentStep);
        }
      }
    }, wizardConfig.settings.autoSaveInterval * 1000);

    return () => clearInterval(interval);
  }, [wizardConfig?.settings.autoSaveInterval, submission, currentStep, isDraftSaving, autoSave]);

  const getCurrentStepData = (): any => {
    // This would collect current form data from the active step
    // Implementation depends on how form state is managed
    return {};
  };

  const handleStepChange = async (newStep: SubmissionStep) => {
    // Track step completion
    await trackEventMutation.mutateAsync({
      submissionId: submission?.id || 'temp',
      eventType: 'step-completed',
      step: currentStep
    });

    // Mark current step as completed
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    
    // Save current step data before moving
    if (submission?.id) {
      const stepData = getCurrentStepData();
      await autoSave(stepData, currentStep);
    }

    // Track new step start
    await trackEventMutation.mutateAsync({
      submissionId: submission?.id || 'temp',
      eventType: 'step-started',
      step: newStep
    });

    setCurrentStep(newStep);
  };

  const handleStepComplete = (stepData: any) => {
    // Update submission data
    setSubmission(prev => ({ ...prev, ...stepData }));
    
    // Clear any errors for this step
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[currentStep];
      return newErrors;
    });
  };

  const handleStepError = (error: string) => {
    setErrors(prev => ({ ...prev, [currentStep]: error }));
  };

  const renderCurrentStep = () => {
    if (!wizardConfig || !submission) {
      return <div className="animate-pulse">Loading...</div>;
    }

    const stepConfig = wizardConfig.steps.find(s => s.id === currentStep);
    const commonProps = {
      config: stepConfig!,
      submission,
      onComplete: handleStepComplete,
      onError: handleStepError,
      journalId
    };

    switch (currentStep) {
      case 'manuscript-upload':
        return <ManuscriptUploadStep {...commonProps} />;
      case 'author-details':
        return <AuthorDetailsStep {...commonProps} />;
      case 'manuscript-details':
        return <ManuscriptDetailsStep {...commonProps} />;
      case 'supplementary-files':
        return <SupplementaryFilesStep {...commonProps} />;
      case 'declarations':
        return <DeclarationsStep {...commonProps} />;
      case 'review-submit':
        return <ReviewSubmitStep {...commonProps} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  if (isLoading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submission wizard...</p>
        </div>
      </div>
    );
  }

  if (!wizardConfig) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Configuration Error</h2>
          <p className="text-red-700">
            Unable to load submission wizard configuration. Please try again or contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Your Manuscript</h1>
        <p className="text-gray-600">
          Complete all steps to submit your research to our journal. 
          Your progress will be automatically saved.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Progress Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <ProgressIndicator
              steps={wizardConfig.steps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepChange}
            />
            
            {/* Auto-save indicator */}
            <AutoSaveIndicator
              isDraftSaving={isDraftSaving}
              lastSaved={lastSaved}
              className="mt-4"
            />
            
            {/* Help toggle */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="mt-4 w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              {showHelp ? 'Hide Help' : 'Show Help'}
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            
            {/* Step Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {wizardConfig.steps.find(s => s.id === currentStep)?.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {wizardConfig.steps.find(s => s.id === currentStep)?.description}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Estimated time: {wizardConfig.steps.find(s => s.id === currentStep)?.estimatedTimeMinutes} min
                </div>
              </div>
              
              {/* Error Message */}
              {errors[currentStep] && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{errors[currentStep]}</p>
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="px-6 py-6">
              {renderCurrentStep()}
            </div>

            {/* Navigation */}
            <div className="border-t border-gray-200 px-6 py-4">
              <NavigationControls
                steps={wizardConfig.steps}
                currentStep={currentStep}
                completedSteps={completedSteps}
                onPrevious={() => {
                  const currentIndex = wizardConfig.steps.findIndex(s => s.id === currentStep);
                  if (currentIndex > 0) {
                    handleStepChange(wizardConfig.steps[currentIndex - 1].id);
                  }
                }}
                onNext={() => {
                  const currentIndex = wizardConfig.steps.findIndex(s => s.id === currentStep);
                  if (currentIndex < wizardConfig.steps.length - 1) {
                    handleStepChange(wizardConfig.steps[currentIndex + 1].id);
                  }
                }}
                canProceed={!errors[currentStep]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <HelpPanel
          currentStep={currentStep}
          stepConfig={wizardConfig.steps.find(s => s.id === currentStep)!}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  );
}