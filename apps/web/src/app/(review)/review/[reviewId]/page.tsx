/**
 * Anonymous Review Interface - Main Review Page
 * 
 * This page provides a clean, distraction-free manuscript reading interface
 * with annotation tools and mobile-responsive design for peer reviewers.
 * All reviewer interactions are anonymous and secure.
 */

import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  MessageSquare, 
  Bookmark, 
  Highlighter,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Palette
} from 'lucide-react';
import { ManuscriptReader } from '@/components/review/manuscript-reader';
import { AnnotationTools } from '@/components/review/annotation-tools';
import { ReviewNotes } from '@/components/review/review-notes';

export const metadata: Metadata = {
  title: 'Manuscript Review | Anonymous Peer Review',
  description: 'Anonymous manuscript review interface with annotation tools',
};

/**
 * Manuscript toolbar with reading controls
 */
function ManuscriptToolbar() {
  return (
    <div className="flex items-center justify-between p-3 border-b bg-muted/30">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="sm">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          <FileText className="h-3 w-3 mr-1" />
          12 pages
        </Badge>
        <Badge variant="outline" className="text-xs">
          <MessageSquare className="h-3 w-3 mr-1" />
          3 annotations
        </Badge>
      </div>
    </div>
  );
}

/**
 * Annotation panel with tools
 */
function AnnotationPanel() {
  const annotationTypes = [
    { id: 'highlight', label: 'Highlight', icon: Highlighter, color: 'bg-yellow-200' },
    { id: 'comment', label: 'Comment', icon: MessageSquare, color: 'bg-blue-200' },
    { id: 'bookmark', label: 'Bookmark', icon: Bookmark, color: 'bg-green-200' },
    { id: 'concern', label: 'Concern', icon: Palette, color: 'bg-red-200' },
  ];

  return (
    <Card className="w-80 h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Annotation Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {annotationTypes.map((type) => (
            <Button
              key={type.id}
              variant="outline"
              size="sm"
              className="h-auto flex-col gap-1 p-2"
            >
              <type.icon className="h-4 w-4" />
              <span className="text-xs">{type.label}</span>
            </Button>
          ))}
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Quick Notes</div>
          <Textarea
            placeholder="Add your review notes here..."
            className="min-h-24 text-sm"
          />
          <Button size="sm" className="w-full">
            Save Note
          </Button>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Review Sections</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Abstract</span>
              <Badge variant="outline" className="text-xs">0 notes</Badge>
            </div>
            <div className="flex justify-between">
              <span>Introduction</span>
              <Badge variant="outline" className="text-xs">2 notes</Badge>
            </div>
            <div className="flex justify-between">
              <span>Methodology</span>
              <Badge variant="outline" className="text-xs">1 note</Badge>
            </div>
            <div className="flex justify-between">
              <span>Results</span>
              <Badge variant="outline" className="text-xs">0 notes</Badge>
            </div>
            <div className="flex justify-between">
              <span>Discussion</span>
              <Badge variant="outline" className="text-xs">0 notes</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main review page component
 */
export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  
  // Get anonymous context from headers
  const headersList = await headers();
  const anonymousId = headersList.get('X-Anonymous-Id');
  
  if (!anonymousId) {
    return (
      <div className="text-center py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Anonymous Session Required
            </h2>
            <p className="text-muted-foreground text-sm">
              You need a valid anonymous reviewer session to access this review.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // TODO: Fetch review data using anonymousId and reviewId
  // const reviewData = await getAnonymousReviewData(anonymousId, reviewId);
  
  // Mock data for now
  const manuscriptTitle = "Advanced Machine Learning Techniques for Climate Change Prediction";
  const manuscriptAuthors = "Authors (Anonymous during review)";
  const submissionDate = "2025-01-15";
  const wordCount = 8945;

  return (
    <div className="space-y-6">
      {/* Manuscript header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl leading-tight">
                {manuscriptTitle}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Submitted: {submissionDate}</span>
                <span>•</span>
                <span>{wordCount.toLocaleString()} words</span>
                <span>•</span>
                <span>Research Article</span>
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0">
              Under Review
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className="text-xs">
              Machine Learning
            </Badge>
            <Badge variant="outline" className="text-xs">
              Climate Science
            </Badge>
            <Badge variant="outline" className="text-xs">
              Predictive Modeling
            </Badge>
          </div>
        </CardHeader>
      </Card>
      
      {/* Main review interface */}
      <div className="flex gap-6">
        {/* Manuscript reader */}
        <div className="flex-1">
          <Card className="h-[800px]">
            <ManuscriptToolbar />
            <CardContent className="p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {/* Abstract */}
                  <section className="mb-8">
                    <h3 className="text-lg font-semibold mb-3">Abstract</h3>
                    <div className="prose prose-sm max-w-none text-justify leading-relaxed">
                      <p className="mb-4">
                        This study presents novel machine learning techniques for enhancing climate change 
                        prediction accuracy through the integration of multiple data sources and advanced 
                        neural network architectures. We propose a hybrid ensemble model that combines 
                        convolutional neural networks (CNNs) for spatial feature extraction with long 
                        short-term memory (LSTM) networks for temporal sequence modeling.
                      </p>
                      <p className="mb-4">
                        Our approach demonstrates significant improvements over existing methods, achieving 
                        a 15% reduction in prediction error for temperature forecasting and 12% improvement 
                        in precipitation pattern recognition. The model was validated using 50 years of 
                        historical climate data from 200 weather stations across multiple climate zones.
                      </p>
                      <p>
                        These findings have important implications for climate policy development and 
                        disaster preparedness strategies. The proposed methodology provides a scalable 
                        framework for real-time climate monitoring and early warning systems.
                      </p>
                    </div>
                  </section>
                  
                  <Separator className="my-6" />
                  
                  {/* Introduction */}
                  <section className="mb-8">
                    <h3 className="text-lg font-semibold mb-3">1. Introduction</h3>
                    <div className="prose prose-sm max-w-none text-justify leading-relaxed">
                      <p className="mb-4">
                        Climate change represents one of the most pressing challenges of our time, with 
                        far-reaching implications for global ecosystems, human societies, and economic 
                        systems. Accurate prediction of climate patterns is crucial for developing 
                        effective mitigation and adaptation strategies (Smith et al., 2023; Johnson & 
                        Brown, 2022).
                      </p>
                      <p className="mb-4">
                        Traditional climate modeling approaches, while valuable, face limitations in 
                        capturing the complex, non-linear relationships between multiple climate 
                        variables. Recent advances in machine learning offer promising avenues for 
                        improving prediction accuracy and computational efficiency (Davis et al., 2024).
                      </p>
                      <p className="mb-4">
                        This paper addresses these challenges by proposing a novel hybrid ensemble 
                        approach that leverages the strengths of different neural network architectures. 
                        Our contribution includes: (1) a new data fusion methodology for integrating 
                        heterogeneous climate data sources, (2) an innovative neural network architecture 
                        optimized for spatiotemporal climate modeling, and (3) comprehensive validation 
                        across diverse climate regions.
                      </p>
                    </div>
                  </section>
                  
                  <Separator className="my-6" />
                  
                  {/* Methodology */}
                  <section className="mb-8">
                    <h3 className="text-lg font-semibold mb-3">2. Methodology</h3>
                    <div className="prose prose-sm max-w-none text-justify leading-relaxed">
                      <p className="mb-4">
                        Our methodology consists of three main components: data preprocessing and 
                        integration, hybrid model architecture design, and ensemble learning strategy. 
                        Each component is designed to address specific challenges in climate prediction.
                      </p>
                      
                      <h4 className="text-base font-semibold mt-6 mb-3">2.1 Data Integration Framework</h4>
                      <p className="mb-4">
                        We developed a comprehensive data integration framework that harmonizes multiple 
                        heterogeneous data sources including satellite imagery, weather station records, 
                        ocean temperature measurements, and atmospheric pressure readings. The framework 
                        employs advanced interpolation techniques to handle missing data and ensures 
                        temporal alignment across all data sources.
                      </p>
                      
                      <h4 className="text-base font-semibold mt-6 mb-3">2.2 Neural Network Architecture</h4>
                      <p className="mb-4">
                        The proposed hybrid architecture combines the spatial feature extraction 
                        capabilities of CNNs with the temporal modeling strengths of LSTM networks. 
                        The CNN component processes gridded climate data to identify spatial patterns, 
                        while the LSTM component captures long-term temporal dependencies and seasonal 
                        variations.
                      </p>
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* Annotation tools panel */}
        <aside className="hidden xl:block">
          <AnnotationPanel />
        </aside>
      </div>
      
      {/* Mobile annotation panel */}
      <div className="xl:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Annotation Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 mb-4">
              <Button variant="outline" size="sm" className="flex-col gap-1 h-auto p-2">
                <Highlighter className="h-4 w-4" />
                <span className="text-xs">Highlight</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-col gap-1 h-auto p-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Comment</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-col gap-1 h-auto p-2">
                <Bookmark className="h-4 w-4" />
                <span className="text-xs">Bookmark</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-col gap-1 h-auto p-2">
                <Palette className="h-4 w-4" />
                <span className="text-xs">Concern</span>
              </Button>
            </div>
            <Textarea
              placeholder="Add your review notes here..."
              className="min-h-20 text-sm"
            />
            <Button size="sm" className="w-full mt-2">
              Save Note
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Review actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Progress saved automatically • Last saved: 2 minutes ago
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                Save Draft
              </Button>
              <Button>
                Continue to Review Form
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}