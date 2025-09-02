# Synfind Platform - Interface Wireframes & User Flows

## Overview

This document provides detailed wireframes and user flow specifications for the five primary interface areas of the Synfind academic publishing platform. Each wireframe includes responsive breakpoints, interaction states, and accessibility considerations aligned with the "Academic Excellence Through Transparent Efficiency" design vision.

## 1. Publisher Executive Dashboard

### Desktop Layout (1024px+)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header                                                                  │
│ [Synfind Logo] [Publisher: Nature Publishing] [Search] [Notifications] [User] │
└─────────────────────────────────────────────────────────────────────────┘
│ Breadcrumb: Publisher Dashboard                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Main Content Area                                                       │
│ ┌─────────────────────────────────────┐ ┌─────────────────────────────┐ │
│ │ Portfolio Performance               │ │ Quick Actions               │ │
│ │ ┌─────────┬─────────┬─────────────┐ │ │ • Add New Journal           │ │
│ │ │ Revenue │ Submiss │ Avg Process │ │ │ • Import from OJS           │ │
│ │ │ $47.2K  │ 1,247   │ 42 days     │ │ │ • View Credit Usage         │ │
│ │ └─────────┴─────────┴─────────────┘ │ │ • Download Reports          │ │
│ │ [Interactive Chart Area]            │ │                             │ │
│ │ Revenue Trends (Last 12 Months)     │ │ Credit Balance: 12,450      │ │
│ └─────────────────────────────────────┘ └─────────────────────────────┘ │
│                                                                         │
│ Journal Portfolio                                     [Filter] [Sort]   │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Grid View                                                           │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │ │
│ │ │ Nature Chem │ │ Nature Phys │ │ Nature Bio  │ │ Add Journal │   │ │
│ │ │ ────────────│ │ ────────────│ │ ────────────│ │             │   │ │
│ │ │ 127 submiss │ │ 89 submiss  │ │ 203 submiss │ │ [+]         │   │ │
│ │ │ 38 days avg │ │ 45 days avg │ │ 33 days avg │ │             │   │ │
│ │ │ $12.4K rev  │ │ $8.9K rev   │ │ $18.7K rev  │ │             │   │ │
│ │ │ [Manage]    │ │ [Manage]    │ │ [Manage]    │ │             │   │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Key Interactive Elements

**Portfolio Performance Card**:
```jsx
const PortfolioMetrics = () => (
  <Card>
    <CardHeader>
      <CardTitle>Portfolio Performance</CardTitle>
      <div className="flex gap-4 text-sm">
        <TimeRangeSelector />
        <JournalFilter />
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Total Revenue"
          value="$47.2K"
          change="+12.4%"
          changeType="positive"
          icon="dollar-sign"
        />
        <MetricCard
          label="Submissions"
          value="1,247"
          change="+8.2%"
          changeType="positive"
          icon="file-text"
        />
        <MetricCard
          label="Avg Processing"
          value="42 days"
          change="-15.3%"
          changeType="positive"
          icon="clock"
        />
      </div>
      <InteractiveChart
        type="line"
        data={revenueData}
        xAxis="month"
        yAxis="revenue"
        height={200}
      />
    </CardContent>
  </Card>
);
```

**Journal Grid Component**:
```jsx
const JournalGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {journals.map(journal => (
      <Card key={journal.id} className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">{journal.name}</CardTitle>
              <CardDescription className="text-sm">
                {journal.category}
              </CardDescription>
            </div>
            <Badge 
              variant={journal.status === 'active' ? 'default' : 'secondary'}
              className="ml-2"
            >
              {journal.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Submissions</span>
              <span className="font-medium">{journal.submissions}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Processing</span>
              <span className="font-medium">{journal.avgDays} days</span>
            </div>
            <div className="flex justify-between">
              <span>Revenue</span>
              <span className="font-medium text-green-600">
                ${journal.revenue}
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => navigateToJournal(journal.id)}
            >
              Manage
            </Button>
            <Button size="sm" variant="outline">
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    ))}
    
    {/* Add New Journal Card */}
    <Card className="border-dashed border-2 hover:border-academic-blue-300">
      <CardContent className="flex flex-col items-center justify-center h-full min-h-48 text-center">
        <Plus className="w-8 h-8 text-academic-gray-400 mb-2" />
        <h3 className="font-medium text-academic-gray-700">Add Journal</h3>
        <p className="text-sm text-academic-gray-500 mb-4">
          Create new journal or import from OJS
        </p>
        <div className="space-y-2">
          <Button size="sm" className="w-full">New Journal</Button>
          <Button size="sm" variant="outline" className="w-full">
            Import OJS
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);
```

### Mobile Layout (375px - 768px)

```
┌─────────────────────────┐
│ [☰] Publisher Dashboard │
│                    [🔔][👤]│
├─────────────────────────┤
│ Portfolio Summary       │
│ ┌─────────────────────┐ │
│ │ Revenue    $47.2K   │ │
│ │ ───────────────────│ │
│ │ Submiss    1,247    │ │
│ │ ───────────────────│ │
│ │ Process    42 days  │ │
│ └─────────────────────┘ │
│                         │
│ Quick Actions           │
│ [📊 Analytics] [➕ Add]  │
│ [📤 Import] [📋 Reports] │
│                         │
│ Your Journals           │
│ ┌─────────────────────┐ │
│ │ Nature Chemistry    │ │
│ │ 127 submissions     │ │
│ │ 38 days avg        │ │
│ │ [Manage]           │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Nature Physics      │ │
│ │ 89 submissions      │ │
│ │ 45 days avg        │ │
│ │ [Manage]           │ │
│ └─────────────────────┘ │
│                         │
│ [🏠][📊][📝][👥][⚙️]      │
└─────────────────────────┘
```

## 2. Editorial Command Center

### Desktop Layout (1024px+)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Synfind] Nature Chemistry | Editorial Dashboard [Search] [🔔] [👤]      │
├─────────────────────────────────────────────────────────────────────────┤
│ Sidebar        │ Main Content Area                                      │
│ Navigation     │                                                        │
│ • Dashboard    │ Submission Pipeline                    [Grid] [List]   │
│ • Submissions  │ ┌─────────┬─────────┬─────────┬──────────────────┐    │
│ • Reviewers    │ │Submitted│Under Rev│Revision │Decision Pending  │    │
│ • Decisions    │ │   (23)  │  (18)   │  (12)   │      (7)        │    │
│ • Analytics    │ ├─────────┼─────────┼─────────┼──────────────────┤    │
│ ───────────   │ │┌───────┐│┌───────┐│┌───────┐│┌────────────────┐│    │
│ AI Insights    │ ││MS-1001││││MS-987 ││││MS-945 ││││MS-923         ││    │
│ ┌───────────┐ │ ││Quantum ││││Plant  ││││Ocean  ││││"AI in Drug    ││    │
│ │🤖 High     │ │ ││Dots... ││││Gene.. ││││Acidif.││││ Discovery"    ││    │
│ │Confidence │ │ ││       ││││       ││││       ││││92% AI Conf    ││    │
│ │92% (3 sub)│ │ ││[View] ││││[View] ││││[View] ││││[Decision Now] ││    │
│ └───────────┘ │ │└───────┘││└───────┘││└───────┘││└────────────────┘│    │
│               │ │         ││         ││         ││                 │    │
│ Urgent Items   │ │┌───────┐││┌───────┐││┌───────┐││┌────────────────┐│    │
│ ⚠️ 3 overdue   │ ││MS-998 ││││MS-976 ││││MS-934 ││││MS-912         ││    │
│ ⏰ 7 due today │ │││       ││││       ││││       ││││               ││    │
│               │ │└───────┘││└───────┘││└───────┘││└────────────────┘│    │
│               │ └─────────┴┴─────────┴┴─────────┴┴──────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Submission Pipeline (Kanban View)

```jsx
const EditorialPipeline = () => {
  const columns = [
    { id: 'submitted', title: 'Submitted', status: 'submitted' },
    { id: 'under-review', title: 'Under Review', status: 'under-review' },
    { id: 'revision', title: 'Revision Needed', status: 'revision' },
    { id: 'decision', title: 'Decision Pending', status: 'decision' }
  ];

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {columns.map(column => (
        <Card key={column.id} className="flex flex-col h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {column.title}
              </CardTitle>
              <Badge variant="secondary">
                {getSubmissionCount(column.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-96">
              <div className="space-y-2 p-3">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2"
                      >
                        {getSubmissionsForStatus(column.status).map((submission, index) => (
                          <Draggable 
                            key={submission.id} 
                            draggableId={submission.id} 
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${
                                  snapshot.isDragging ? 'opacity-50' : ''
                                }`}
                              >
                                <SubmissionCard 
                                  submission={submission}
                                  showAI={column.status === 'submitted'}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
```

#### Submission Card with AI Integration

```jsx
const SubmissionCard = ({ submission, showAI }) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer">
    <CardContent className="p-3">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2">
              {submission.title}
            </h4>
            <p className="text-xs text-academic-gray-500 mt-1">
              {submission.authors[0]} {submission.authors.length > 1 && `+${submission.authors.length - 1}`}
            </p>
          </div>
          {submission.urgent && (
            <Badge variant="destructive" className="ml-2">
              Urgent
            </Badge>
          )}
        </div>
        
        {showAI && submission.aiRecommendation && (
          <div className="p-2 bg-confidence-bg rounded-md border border-confidence-high/20">
            <div className="flex items-center gap-2">
              <Icon name="ai-suggestion" className="w-3 h-3 text-confidence-high" />
              <span className="text-xs font-medium">
                AI Recommends: {submission.aiRecommendation.action}
              </span>
              <Badge variant="outline" className="text-xs">
                {submission.aiRecommendation.confidence}%
              </Badge>
            </div>
            <p className="text-xs text-academic-gray-600 mt-1">
              {submission.aiRecommendation.reasoning}
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-academic-gray-500">
          <span>Submitted {submission.submittedDate}</span>
          <span>{submission.daysInStage} days</span>
        </div>
        
        <div className="flex gap-2 mt-2">
          <Button size="xs" className="flex-1">
            View
          </Button>
          {submission.aiRecommendation && (
            <Button size="xs" variant="outline" className="text-xs">
              Accept AI
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);
```

### Mobile Layout for Editorial Dashboard

```
┌─────────────────────────┐
│ [☰] Editorial Dashboard │
│                    [🔔][👤]│
├─────────────────────────┤
│ Filter: [All ▼] [📊]    │
│                         │
│ AI Suggestions (3)      │
│ ┌─────────────────────┐ │
│ │ MS-923: Drug Disc.  │ │
│ │ 92% Confidence     │ │
│ │ Recommend: Accept   │ │
│ │ [View] [Accept AI]  │ │
│ └─────────────────────┘ │
│                         │
│ Urgent Items (7)        │
│ ┌─────────────────────┐ │
│ │ ⚠️ MS-1001 (Overdue)│ │
│ │ Quantum Dots        │ │
│ │ 3 days overdue     │ │
│ │ [Review Now]       │ │
│ └─────────────────────┘ │
│                         │
│ Recent Submissions      │
│ ┌─────────────────────┐ │
│ │ MS-1005: Plant Gen. │ │
│ │ Under Review (2d)   │ │
│ │ [View]             │ │
│ └─────────────────────┘ │
│                         │
│ [🏠][📊][📝][👥][⚙️]      │
└─────────────────────────┘
```

## 3. Author Manuscript Portal

### Submission Wizard Flow

```
Step 1: Upload Manuscript
┌─────────────────────────────────────────────────────────────────────────┐
│ Submit Your Research                                    Step 1 of 5      │
│ ○─●─○─○─○ Upload • Details • Authors • Services • Review               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Upload Your Manuscript                                                  │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                     │ │
│ │    Drag and drop your files here                                   │ │
│ │                     or                                             │ │
│ │              [Choose Files]                                        │ │
│ │                                                                     │ │
│ │    Supported formats: PDF, DOCX, LaTeX                           │ │
│ │    Maximum size: 10GB per submission                              │ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ Uploaded Files:                                                         │
│ ✓ manuscript.pdf (2.3MB)                                              │
│ ✓ supplementary-data.xlsx (45MB)                                      │
│ ✓ figures.zip (12MB)                                                  │
│                                                                         │
│ [← Back]                                      [Continue →]             │
└─────────────────────────────────────────────────────────────────────────┘
```

#### File Upload Component
```jsx
const ManuscriptUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Upload Your Manuscript</h2>
        <p className="text-academic-gray-600 mt-2">
          Submit your research files for peer review
        </p>
      </div>

      <FileDropzone
        onFilesSelected={handleFilesSelected}
        maxSize="10GB"
        acceptedTypes={['.pdf', '.docx', '.tex', '.zip', '.xlsx', '.csv']}
        multiple
        className="h-48"
      >
        <div className="text-center">
          <Upload className="w-12 h-12 text-academic-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-academic-gray-700">
            Drag and drop your files here
          </p>
          <p className="text-sm text-academic-gray-500 mt-1">
            or click to browse your computer
          </p>
          <div className="mt-4 text-xs text-academic-gray-500">
            <p>Supported: PDF, DOCX, LaTeX, Excel, CSV, ZIP</p>
            <p>Maximum: 10GB total per submission</p>
          </div>
        </div>
      </FileDropzone>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-academic-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <FileIcon type={file.type} />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-academic-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'uploading' ? (
                      <Progress value={file.progress} className="w-20" />
                    ) : file.status === 'complete' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

### Author Dashboard - Desktop

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Synfind] Author Portal                         [Search] [🔔] [👤]       │
├─────────────────────────────────────────────────────────────────────────┤
│ Welcome back, Dr. Sarah Chen                                            │
│                                                                         │
│ Your Submissions                              [📝 New Submission]       │
│ ┌─────────────────────────────────────────┐ ┌─────────────────────────┐ │
│ │ Active Submissions                      │ │ Account Overview        │ │
│ │                                         │ │                         │ │
│ │ ┌─────────────────────────────────────┐ │ │ Credit Balance          │ │
│ │ │ "Machine Learning in Drug Discovery"│ │ │ 1,250 credits          │ │
│ │ │ Nature Chemistry • Under Review     │ │ │ [💳 Add Credits]        │ │
│ │ │ ████████████████░░░░ 67% complete   │ │ │                         │ │
│ │ │ Estimated completion: 12 days      │ │ │ Quick Services          │ │
│ │ │ [View Details]                     │ │ │ • Plagiarism Check      │ │
│ │ └─────────────────────────────────────┘ │ │ • Grammar Review        │ │
│ │                                         │ │ • Citation Format       │ │
│ │ ┌─────────────────────────────────────┐ │ │ • Professional Edit     │ │
│ │ │ "Quantum Dots in Solar Cells"      │ │ │                         │ │
│ │ │ Nature Physics • Revision Needed   │ │ │ Recent Activity         │ │
│ │ │ Action required by June 15         │ │ │ • Review completed      │ │
│ │ │ [📝 Submit Revision]               │ │ │ • Comment from editor   │ │
│ │ └─────────────────────────────────────┘ │ │ • Service completed     │ │
│ └─────────────────────────────────────────┘ └─────────────────────────┘ │
│                                                                         │
│ Submission History                                           [View All]  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ✅ "Neural Networks for Protein Folding" - Nature Bio - Published   │ │
│ │ ✅ "CRISPR Applications in Medicine" - Nature Chemistry - Published │ │
│ │ ❌ "Synthetic Biology Ethics" - Nature Reviews - Rejected           │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Author Submission Timeline Component
```jsx
const SubmissionTimeline = ({ submission }) => {
  const timelineSteps = [
    { step: 'Submitted', date: submission.submittedDate, completed: true },
    { step: 'Initial Review', date: submission.initialReviewDate, completed: true },
    { step: 'Peer Review', date: submission.peerReviewDate, completed: submission.status !== 'submitted' },
    { step: 'Decision', date: submission.decisionDate, completed: submission.status === 'accepted' || submission.status === 'rejected' },
    { step: 'Publication', date: submission.publicationDate, completed: submission.status === 'published' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{submission.title}</CardTitle>
        <CardDescription>
          {submission.journal} • {submission.status}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Progress 
              value={calculateProgress(submission.status)} 
              className="flex-1"
            />
            <span className="text-sm font-medium">
              {calculateProgress(submission.status)}% complete
            </span>
          </div>
          
          <div className="space-y-3">
            {timelineSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  step.completed 
                    ? 'bg-academic-blue-500' 
                    : 'bg-academic-gray-300'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm ${
                    step.completed 
                      ? 'font-medium text-academic-gray-900' 
                      : 'text-academic-gray-500'
                  }`}>
                    {step.step}
                  </p>
                  {step.date && (
                    <p className="text-xs text-academic-gray-500">
                      {step.date}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {submission.estimatedCompletion && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm font-medium text-blue-900">
                Estimated completion: {submission.estimatedCompletion}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">View Details</Button>
            {submission.actionRequired && (
              <Button size="sm" variant="outline">
                {submission.actionRequired}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

## 4. Reviewer Professional Workspace

### Desktop Review Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Synfind] Review: "Machine Learning in Drug Discovery" [🔔] [👤]         │
├─────────────────────────────────────────────────────────────────────────┤
│ Manuscript Viewer                          │ Review Panel              │
│ ┌─────────────────────────────────────────┐│ ┌─────────────────────────┐│
│ │ Title: Machine Learning in Drug Discovery││ │ [Review][Notes][Help]   ││
│ │ Authors: S. Chen, M. Johnson, et al.     ││ │                         ││
│ │ ═══════════════════════════════════════ ││ │ Review Form             ││
│ │                                         ││ │                         ││
│ │ Abstract                                ││ │ Overall Recommendation  ││
│ │ Machine learning techniques have revo-  ││ │ ○ Accept               ││
│ │ lutionized drug discovery by enabling   ││ │ ○ Minor Revision       ││
│ │ rapid screening of molecular compounds  ││ │ ● Major Revision       ││
│ │ and predicting their efficacy. This     ││ │ ○ Reject               ││
│ │ review examines current applications... ││ │                         ││
│ │                                         ││ │ Significance: ⭐⭐⭐⭐☆   ││
│ │ [Comment added: "Needs more recent     ]││ │ Methodology: ⭐⭐⭐☆☆    ││
│ │ references from 2023-2024"]            ││ │ Clarity: ⭐⭐⭐⭐⭐      ││
│ │                                         ││ │                         ││
│ │ 1. Introduction                         ││ │ Comments to Authors     ││
│ │ The field of computational drug         ││ │ ┌─────────────────────┐ ││
│ │ discovery has experienced rapid         ││ │ │ This paper provides │ ││
│ │ growth... [Highlight: Citation needed] ││ │ │ a comprehensive...  │ ││
│ │                                         ││ │ │                     │ ││
│ │ [▼ Scroll for more content]             ││ │ └─────────────────────┘ ││
│ └─────────────────────────────────────────┘│ │                         ││
│                                           │ │ Confidential Comments   ││
│                                           │ │ (Editors Only)          ││
│                                           │ │ ┌─────────────────────┐ ││
│                                           │ │ │ The methodology     │ ││
│                                           │ │ │ section needs...    │ ││
│                                           │ │ │                     │ ││
│                                           │ │ └─────────────────────┘ ││
│                                           │ │                         ││
│                                           │ │ [Save Draft][Submit]    ││
│                                           │ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

#### Manuscript Annotation System
```jsx
const ManuscriptViewer = ({ manuscript, annotations, onAnnotate }) => {
  const [selectedText, setSelectedText] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      setSelectedText(selection.toString());
      setShowCommentDialog(true);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4 bg-white">
        <h2 className="font-semibold text-lg">{manuscript.title}</h2>
        <p className="text-academic-gray-600 text-sm">
          {manuscript.authors.join(', ')}
        </p>
        <div className="flex items-center gap-4 mt-2 text-sm text-academic-gray-500">
          <span>Submitted: {manuscript.submittedDate}</span>
          <span>Pages: {manuscript.pageCount}</span>
          <span>Word count: {manuscript.wordCount}</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6 bg-white">
        <div 
          className="max-w-none prose prose-academic"
          onMouseUp={handleTextSelection}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: manuscript.content }}
            className="relative"
          />
          
          {/* Render existing annotations */}
          {annotations.map(annotation => (
            <AnnotationMarker
              key={annotation.id}
              annotation={annotation}
              onEdit={handleEditAnnotation}
              onDelete={handleDeleteAnnotation}
            />
          ))}
        </div>
      </div>

      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Selected text: "{selectedText}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your comment or suggestion..."
              className="min-h-24"
            />
            <div className="flex items-center gap-2">
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Comment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="praise">Positive feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddComment}>
              Add Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
```

### Mobile Review Interface

```
┌─────────────────────────┐
│ Review: ML Drug Discovery│
│                    [👤] │
├─────────────────────────┤
│ [📄 Manuscript][✍️ Form] │
│                         │
│ Machine Learning in     │
│ Drug Discovery          │
│ S. Chen, M. Johnson...  │
│ ═══════════════════════ │
│                         │
│ Abstract                │
│ Machine learning tech-  │
│ niques have revolution- │
│ ized drug discovery by  │
│ enabling rapid screen-  │
│ ing of molecular comp-  │
│ ounds...                │
│                         │
│ [💬 Add Comment]        │
│                         │
│ 📝 Your Comments (3)    │
│ • "Needs recent refs"   │
│ • "Citation needed"     │
│ • "Great methodology"   │
│                         │
│ [📄 Continue Reading]   │
│ [✍️ Complete Review]    │
│                         │
│ Progress: ████████░░ 80%│
│ Due: June 15, 2024     │
└─────────────────────────┘
```

## 5. Migration Control Dashboard

### Desktop Migration Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Synfind] OJS Migration: Nature Chemistry            [🔔] [👤]           │
├─────────────────────────────────────────────────────────────────────────┤
│ Migration Overview                                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Source: OJS 3.2.1 → Target: Synfind Platform                       │ │
│ │ Journal: Nature Chemistry │ Articles: 1,247 │ Timeline: 18/30 days │ │
│ │ ████████████████████████████████████████░░░░░░░░░░ 67% Complete    │ │
│ │                                                                     │ │
│ │ Current Phase: User Account Migration                               │ │
│ │ ✅ Database Analysis    ✅ Content Export    🔄 User Migration       │ │
│ │ ⏳ Review Workflows     ⏳ Testing Phase     ⏳ Go-Live             │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────┐ │
│ │ Migration Details               │ │ Data Validation                 │ │
│ │                                 │ │                                 │ │
│ │ Phase 3: User Account Migration │ │ Validation Checks               │ │
│ │ ██████████████████████████░░░░  │ │ ✅ Article metadata (1,247)    │ │
│ │ Progress: 1,048 / 1,387 users   │ │ ✅ Author accounts (892)        │ │
│ │ ETA: 3 hours remaining          │ │ ✅ Review history (3,456)       │ │
│ │                                 │ │ 🔄 User accounts (1,048)        │ │
│ │ Recent Activity:                │ │ ⏳ Editorial workflows           │ │
│ │ • 12:34 - Migrated 50 users     │ │ ⏳ Journal settings             │ │
│ │ • 12:28 - Resolved conflict     │ │                                 │ │
│ │ • 12:15 - Started user batch    │ │ Issues Found: 3                 │ │
│ │                                 │ │ • 2 duplicate email addresses  │ │
│ │ [View Detailed Log]             │ │ • 1 invalid role assignment    │ │
│ │                                 │ │ [View All Issues]               │ │
│ └─────────────────────────────────┘ └─────────────────────────────────┘ │
│                                                                         │
│ Migration Controls                                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [⏸️ Pause Migration] [🔄 Rollback to Phase 2] [📋 Export Logs]      │ │
│ │ [📧 Notify Stakeholders] [🧪 Run Validation] [📞 Contact Support]   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Migration Progress Component
```jsx
const MigrationProgress = ({ migration }) => {
  const phases = [
    { 
      name: 'Database Analysis', 
      status: 'completed', 
      duration: '2 days',
      description: 'Analyze OJS database structure and identify customizations'
    },
    { 
      name: 'Content Export', 
      status: 'completed', 
      duration: '3 days',
      description: 'Export articles, metadata, and files from OJS'
    },
    { 
      name: 'User Migration', 
      status: 'in-progress', 
      duration: '4 days',
      description: 'Migrate user accounts and authentication data',
      progress: 75
    },
    { 
      name: 'Review Workflows', 
      status: 'pending', 
      duration: '5 days',
      description: 'Configure editorial workflows and reviewer assignments'
    },
    { 
      name: 'Testing Phase', 
      status: 'pending', 
      duration: '7 days',
      description: 'Comprehensive testing and validation'
    },
    { 
      name: 'Go-Live', 
      status: 'pending', 
      duration: '1 day',
      description: 'Switch to production and notify users'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Migration Progress</CardTitle>
        <CardDescription>
          {migration.sourceSystem} → Synfind Platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{migration.journalName}</p>
              <p className="text-sm text-academic-gray-500">
                {migration.totalItems} articles • Day {migration.daysPassed} of {migration.totalDays}
              </p>
            </div>
            <Badge variant={migration.status === 'on-track' ? 'default' : 'secondary'}>
              {migration.status === 'on-track' ? 'On Track' : 'Attention Needed'}
            </Badge>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{migration.overallProgress}%</span>
            </div>
            <Progress value={migration.overallProgress} className="h-2" />
          </div>

          <div className="space-y-3">
            {phases.map((phase, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  phase.status === 'completed' 
                    ? 'bg-green-100 text-green-700'
                    : phase.status === 'in-progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {phase.status === 'completed' ? (
                    <Check className="w-3 h-3" />
                  ) : phase.status === 'in-progress' ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{phase.name}</p>
                    <span className="text-xs text-academic-gray-500">
                      {phase.duration}
                    </span>
                  </div>
                  <p className="text-xs text-academic-gray-500">
                    {phase.description}
                  </p>
                  {phase.progress && (
                    <Progress value={phase.progress} className="h-1 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

This comprehensive wireframe specification provides detailed layouts and component structures for implementing the five core user interface areas of the Synfind academic publishing platform, ensuring consistency with the design system and meeting all accessibility and responsiveness requirements outlined in the PRD.