import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PublisherOverview } from '@/components/dashboard/PublisherOverview';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your publishers and journals
          </p>
        </div>
        <PublisherOverview userId={session.user.id!} />
      </div>
    </DashboardLayout>
  );
}