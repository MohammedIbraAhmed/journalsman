import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PublisherDetails } from '@/components/publishers/PublisherDetails';

interface PublisherPageProps {
  params: { id: string };
}

export default async function PublisherPage({ params }: PublisherPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <PublisherDetails publisherId={params.id} userId={session.user.id!} />
    </DashboardLayout>
  );
}