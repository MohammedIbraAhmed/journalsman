'use client';

import React from 'react';
import type { WizardStep, SubmissionStep } from '@shared/types';

interface ProgressIndicatorProps {
  steps: WizardStep[];
  currentStep: SubmissionStep;
  completedSteps: Set<SubmissionStep>;
  onStepClick: (step: SubmissionStep) => void;
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className = ''
}: ProgressIndicatorProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const totalSteps = steps.length;

  const getStepStatus = (step: WizardStep, index: number) => {
    if (completedSteps.has(step.id)) {
      return 'completed';
    } else if (step.id === currentStep) {
      return 'current';
    } else if (index < currentStepIndex) {
      return 'available'; // Can go back to previous steps
    } else {
      return 'upcoming';
    }
  };

  const getStepIcon = (step: WizardStep, status: string) => {
    if (status === 'completed') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (status === 'current') {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="4" />
        </svg>
      );
    } else {
      return (
        <span className="text-sm font-medium text-gray-400">
          {steps.findIndex(s => s.id === step.id) + 1}
        </span>
      );
    }
  };

  const getStepClasses = (status: string, isClickable: boolean) => {
    const baseClasses = "flex items-center w-8 h-8 rounded-full border-2 transition-colors duration-200";
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-500 border-green-500 ${isClickable ? 'cursor-pointer hover:bg-green-600' : ''}`;
      case 'current':
        return `${baseClasses} bg-white border-blue-600`;
      case 'available':
        return `${baseClasses} bg-white border-blue-300 ${isClickable ? 'cursor-pointer hover:border-blue-500' : ''}`;
      default:
        return `${baseClasses} bg-gray-100 border-gray-300`;
    }
  };

  const getConnectorClasses = (index: number) => {
    if (index >= currentStepIndex) {
      return "bg-gray-300";
    }
    return "bg-green-500";
  };

  return (
    <div className={`progress-indicator ${className}`}>
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{completedSteps.size} of {totalSteps} completed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(completedSteps.size / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step List */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step, index);
          const isClickable = status === 'completed' || status === 'current' || status === 'available';
          
          return (
            <div key={step.id} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div 
                  className={`absolute left-4 top-8 w-px h-6 ${getConnectorClasses(index)} transition-colors duration-200`}
                />
              )}
              
              {/* Step Item */}
              <div 
                className={`flex items-start space-x-3 ${isClickable ? 'cursor-pointer' : ''} group`}
                onClick={() => isClickable && onStepClick(step.id)}
              >
                {/* Step Number/Icon */}
                <div className={getStepClasses(status, isClickable)}>
                  {getStepIcon(step, status)}
                </div>
                
                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-sm font-medium ${
                      status === 'current' ? 'text-blue-600' : 
                      status === 'completed' ? 'text-green-600' : 
                      'text-gray-900'
                    } ${isClickable ? 'group-hover:text-blue-600' : ''} transition-colors`}>
                      {step.title}
                    </h4>
                    
                    {/* Required indicator */}
                    {step.isRequired && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                  </div>
                  
                  {/* Step Description */}
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {step.description}
                  </p>
                  
                  {/* Time estimate */}
                  <div className="flex items-center mt-1 text-xs text-gray-400">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {step.estimatedTimeMinutes} min
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <div className="font-medium">Total estimated time:</div>
            <div>{steps.reduce((total, step) => total + step.estimatedTimeMinutes, 0)} minutes</div>
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-4 text-xs text-gray-500">
        You can return to previous steps to make changes. Your progress is automatically saved.
      </div>
    </div>
  );
}