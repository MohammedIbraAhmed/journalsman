/**
 * Review Layout - Anonymous Review Interface
 * 
 * This layout provides the foundation for all review-related pages,
 * ensuring anonymity protection and consistent UI patterns for reviewers.
 */

import { Metadata } from 'next';
import { headers } from 'next/headers';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Eye, Clock, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Peer Review System | JournalsMan',
  description: 'Anonymous peer review interface with anonymity protection',
};

/**
 * Review interface navigation
 */
function ReviewNavigation({ anonymousId }: { anonymousId?: string }) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-green-500" />
          <span>Anonymous Session Active</span>
        </div>
        {anonymousId && (
          <div className="flex items-center gap-2 text-xs font-mono bg-muted px-2 py-1 rounded">
            <span>ID:</span>
            <span className="font-bold">{anonymousId.substring(0, 8)}...</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>Identity Protected</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>Session Active</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Review progress sidebar
 */
function ReviewSidebar() {
  const progressSteps = [
    { id: 1, title: 'Read Manuscript', status: 'current', icon: FileText },
    { id: 2, title: 'Complete Review Form', status: 'pending', icon: FileText },
    { id: 3, title: 'Submit Review', status: 'pending', icon: FileText },
  ];

  return (
    <Card className="w-64 h-fit">
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-4">Review Progress</h3>
        <div className="space-y-3">
          {progressSteps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium
                ${step.status === 'current' 
                  ? 'bg-primary text-primary-foreground' 
                  : step.status === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {step.status === 'completed' ? '✓' : step.id}
              </div>
              <div className="flex-1">
                <div className={`text-sm ${
                  step.status === 'current' ? 'font-medium' : ''
                }`}>
                  {step.title}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between mb-1">
              <span>Progress</span>
              <span>33%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full w-1/3"></div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Time Remaining</span>
              <span className="font-medium">18 days</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Main review layout component
 */
export default async function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get anonymous context from headers (set by middleware)
  const headersList = await headers();
  const anonymousId = headersList.get('X-Anonymous-Id') || undefined;
  const reviewId = headersList.get('X-Review-Id') || undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Anonymous session indicator */}
      <ReviewNavigation anonymousId={anonymousId} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar with progress and navigation */}
          <aside className="hidden lg:block">
            <ReviewSidebar />
          </aside>
          
          {/* Main content area */}
          <main className="flex-1 max-w-5xl">
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="pr-4">
                {children}
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>
      
      {/* Mobile progress indicator */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Anonymous Review</span>
          </div>
          <div className="text-muted-foreground">
            Step 1 of 3
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div className="bg-primary h-2 rounded-full w-1/3"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Layout with error boundary for anonymous sessions
 */
export function ReviewLayoutWithErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <div className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Anonymous Session Required
            </h2>
            <p className="text-muted-foreground mb-4">
              You need a valid anonymous reviewer session to access this interface.
              Please contact your editorial team for access.
            </p>
            <div className="text-sm text-muted-foreground">
              This system protects reviewer anonymity through secure session management.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}