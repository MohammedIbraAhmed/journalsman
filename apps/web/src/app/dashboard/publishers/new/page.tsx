import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CreatePublisherForm } from '@/components/publishers/CreatePublisherForm';

export default async function NewPublisherPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Publisher</h1>
          <p className="text-muted-foreground">
            Set up a new publisher to manage journals and submissions
          </p>
        </div>
        <CreatePublisherForm userId={session.user.id!} />
      </div>
    </DashboardLayout>
  );
}