import BrandingConfiguration from '@/components/branding/BrandingConfiguration';

export const metadata = {
  title: 'Journal Branding - JournalsMan',
  description: 'Customize your journal\'s appearance and maintain professional branding',
};

export default function JournalBrandingPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BrandingConfiguration journalId={params.id} />
      </div>
    </div>
  );
}