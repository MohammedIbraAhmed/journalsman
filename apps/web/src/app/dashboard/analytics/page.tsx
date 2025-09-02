import { redirect } from 'next/navigation';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export const metadata = {
  title: 'Real-Time Analytics Dashboard - JournalsMan',
  description: 'Comprehensive real-time analytics for multi-journal publishing operations',
};

export default function AnalyticsPage({
  searchParams,
}: {
  searchParams: { publisherId?: string };
}) {
  // In a real implementation, we would get the publisherId from the user's session
  // For now, using from search params or defaulting
  const publisherId = searchParams.publisherId || 'demo-publisher';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnalyticsDashboard publisherId={publisherId} />
      </div>
    </div>
  );
}