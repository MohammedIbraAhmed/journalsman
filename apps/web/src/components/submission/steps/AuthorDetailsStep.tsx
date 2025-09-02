'use client';

import React from 'react';
import type { WizardStep, ManuscriptSubmission } from '@shared/types';

interface AuthorDetailsStepProps {
  config: WizardStep;
  submission: Partial<ManuscriptSubmission>;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
  journalId: string;
}

export function AuthorDetailsStep({ config, submission, onComplete, onError, journalId }: AuthorDetailsStepProps) {
  return (
    <div className="author-details-step">
      <div className="space-y-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Author Details Step</h3>
          <p className="text-gray-600">Author information form will be implemented here</p>
          <div className="mt-4">
            <button
              onClick={() => onComplete({ authors: [] })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Continue (Mock)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}