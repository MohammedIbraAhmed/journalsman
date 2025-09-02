import SubmissionWizard from '@/components/submission/SubmissionWizard';

export const metadata = {
  title: 'Submit Manuscript - JournalsMan',
  description: 'Submit your research manuscript with our streamlined submission process',
};

interface SubmissionPageProps {
  params: {
    journalId: string;
  };
}

export default function SubmissionPage({ params }: SubmissionPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SubmissionWizard journalId={params.journalId} />
    </div>
  );
}