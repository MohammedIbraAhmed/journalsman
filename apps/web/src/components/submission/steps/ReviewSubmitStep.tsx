'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import type { WizardStep, ManuscriptSubmission } from '@shared/types';

interface ReviewSubmitStepProps {
  config: WizardStep;
  submission: Partial<ManuscriptSubmission>;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
  journalId: string;
}

export function ReviewSubmitStep({ config, submission, onComplete, onError, journalId }: ReviewSubmitStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ trackingNumber: string; submissionDate: Date } | null>(null);

  const submitMutation = trpc.submission.submitManuscript.useMutation({
    onSuccess: (result) => {
      setSubmissionResult(result);
      setSubmitted(true);
      setIsSubmitting(false);
      onComplete({ submitted: true, trackingNumber: result.trackingNumber });
    },
    onError: (error) => {
      onError(`Submission failed: ${error.message}`);
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async () => {
    if (!submission.id) {
      onError('Submission data is missing');
      return;
    }

    setIsSubmitting(true);
    submitMutation.mutate({ submissionId: submission.id });
  };

  if (submitted && submissionResult) {
    return (
      <div className="review-submit-step">
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Submission Successful!</h3>
          <p className="text-gray-600 mb-4">Your manuscript has been successfully submitted for review.</p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-green-800">
              <p className="font-semibold">Tracking Number: {submissionResult.trackingNumber}</p>
              <p>Submitted: {submissionResult.submissionDate.toLocaleDateString()}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            You will receive a confirmation email shortly. You can track your submission status in your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-submit-step">
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Review Before Submission</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Please review all information carefully. Once submitted, major changes may require editor approval.
              </p>
            </div>
          </div>
        </div>

        {/* Submission Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Summary</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Manuscript File</h4>
              <p className="text-sm text-gray-600">
                {submission.manuscriptFile?.originalName || 'No file uploaded'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700">Title</h4>
              <p className="text-sm text-gray-600">
                {submission.title || 'Not provided'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700">Authors</h4>
              <p className="text-sm text-gray-600">
                {submission.authors?.length ? `${submission.authors.length} author(s)` : 'No authors provided'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700">Keywords</h4>
              <p className="text-sm text-gray-600">
                {submission.keywords?.length ? submission.keywords.join(', ') : 'No keywords provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Submission Agreement */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <input
              id="submission-agreement"
              type="checkbox"
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="submission-agreement" className="ml-3 text-sm text-blue-800">
              I confirm that this manuscript is original work, has not been published elsewhere, and is not under 
              consideration at another journal. I agree to the journal's submission guidelines and editorial policies.
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            } transition-colors`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Submit Manuscript
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}