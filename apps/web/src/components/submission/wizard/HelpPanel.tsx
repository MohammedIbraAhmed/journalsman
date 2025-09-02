'use client';

import React from 'react';
import type { WizardStep, SubmissionStep } from '@shared/types';

interface HelpPanelProps {
  currentStep: SubmissionStep;
  stepConfig: WizardStep;
  onClose: () => void;
}

export function HelpPanel({ currentStep, stepConfig, onClose }: HelpPanelProps) {
  const getStepSpecificHelp = (): { title: string; content: string[]; tips: string[] } => {
    switch (currentStep) {
      case 'manuscript-upload':
        return {
          title: 'Manuscript Upload Help',
          content: [
            'Upload your main manuscript file in PDF, DOCX, or LaTeX format.',
            'Files up to 10GB are supported with automatic chunked upload and resume capability.',
            'The system will automatically validate your file format and scan for viruses.'
          ],
          tips: [
            'PDF format is preferred for final submissions',
            'Ensure your file is not password protected',
            'Include all figures and tables in the main document when possible',
            'Use clear, descriptive filenames without special characters'
          ]
        };
      
      case 'author-details':
        return {
          title: 'Author Information Help',
          content: [
            'Provide complete information for all authors who contributed to this work.',
            'Institutional affiliations should be current and complete.',
            'One author must be designated as the corresponding author.'
          ],
          tips: [
            'ORCID IDs help identify authors uniquely',
            'List authors in the order they should appear in publication',
            'Include department and institution for each affiliation',
            'Verify email addresses are current and accessible'
          ]
        };
      
      case 'manuscript-details':
        return {
          title: 'Manuscript Details Help',
          content: [
            'Provide a clear, descriptive title for your manuscript.',
            'Write an informative abstract that summarizes your key findings.',
            'Select 3-6 relevant keywords that describe your research.'
          ],
          tips: [
            'Titles should be concise but descriptive (typically 10-15 words)',
            'Abstracts should be 150-300 words for most journals',
            'Keywords should include both general and specific terms',
            'Follow the journal\'s specific formatting requirements'
          ]
        };
      
      case 'supplementary-files':
        return {
          title: 'Supplementary Materials Help',
          content: [
            'Upload additional files that support your manuscript.',
            'Common supplementary materials include datasets, additional figures, videos, and source code.',
            'Each file should be clearly described and referenced in your manuscript.'
          ],
          tips: [
            'Organize files logically with descriptive names',
            'Include README files for complex datasets',
            'Ensure data files are in standard, accessible formats',
            'Consider file size limits and accessibility for reviewers'
          ]
        };
      
      case 'declarations':
        return {
          title: 'Declarations Help',
          content: [
            'Complete required declarations about funding, conflicts of interest, and research ethics.',
            'Provide accurate information about all funding sources.',
            'Declare any potential conflicts of interest, even if you believe they are minor.'
          ],
          tips: [
            'Include grant numbers and funding agency details',
            'Consider financial and non-financial conflicts',
            'Ethics approval is required for human subjects research',
            'Data availability statements are increasingly required'
          ]
        };
      
      case 'review-submit':
        return {
          title: 'Review & Submit Help',
          content: [
            'Carefully review all information before final submission.',
            'Ensure all required fields are complete and accurate.',
            'Once submitted, major changes may not be possible without editor approval.'
          ],
          tips: [
            'Double-check author names and affiliations for accuracy',
            'Verify that all files upload correctly and are readable',
            'Review your manuscript against the journal\'s submission guidelines',
            'Keep a record of your submission confirmation and tracking number'
          ]
        };
      
      default:
        return {
          title: 'General Help',
          content: ['General submission guidance'],
          tips: ['Contact support if you need additional assistance']
        };
    }
  };

  const helpContent = getStepSpecificHelp();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="help-panel-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900" id="help-panel-title">
                {helpContent.title}
              </h3>
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Step help text */}
              {stepConfig.helpText && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">{stepConfig.helpText}</p>
                </div>
              )}

              {/* General information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Information</h4>
                <div className="space-y-2">
                  {helpContent.content.map((item, index) => (
                    <p key={index} className="text-sm text-gray-600">{item}</p>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Tips & Best Practices</h4>
                <ul className="space-y-1">
                  {helpContent.tips.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                      <svg className="h-3 w-3 mt-0.5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Estimated time reminder */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Estimated time for this step:</span> {stepConfig.estimatedTimeMinutes} minutes
                  </div>
                </div>
              </div>

              {/* Contact support */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500">
                  Need additional help? Contact our support team at{' '}
                  <a href="mailto:support@journalsman.com" className="text-blue-600 hover:text-blue-500">
                    support@journalsman.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}