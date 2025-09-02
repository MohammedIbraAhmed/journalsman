'use client';

import React from 'react';
import type { WizardStep, SubmissionStep } from '@shared/types';

interface NavigationControlsProps {
  steps: WizardStep[];
  currentStep: SubmissionStep;
  completedSteps: Set<SubmissionStep>;
  onPrevious: () => void;
  onNext: () => void;
  canProceed: boolean;
  className?: string;
}

export function NavigationControls({
  steps,
  currentStep,
  completedSteps,
  onPrevious,
  onNext,
  canProceed,
  className = ''
}: NavigationControlsProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const currentStepConfig = steps[currentStepIndex];

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Previous Button */}
      <div>
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrevious}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
        )}
      </div>

      {/* Step Info */}
      <div className="flex items-center space-x-4 text-sm text-gray-500">
        <span>
          Step {currentStepIndex + 1} of {steps.length}
        </span>
        {currentStepConfig.isRequired && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Required
          </span>
        )}
      </div>

      {/* Next Button */}
      <div>
        {isLastStep ? (
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${
              canProceed
                ? 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Submit Manuscript
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${
              canProceed
                ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Continue
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}