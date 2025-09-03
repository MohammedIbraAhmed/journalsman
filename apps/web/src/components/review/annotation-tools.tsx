/**
 * Annotation Tools Component
 * 
 * Provides comprehensive annotation capabilities for manuscript review,
 * including highlighting, commenting, bookmarking, and flagging concerns.
 * All annotations maintain anonymity protection.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Highlight, 
  MessageSquare, 
  Bookmark, 
  AlertTriangle,
  Trash2,
  Edit,
  Clock,
  Tag
} from 'lucide-react';

interface Annotation {
  id: string;
  type: 'highlight' | 'comment' | 'bookmark' | 'concern';
  text: string;
  comment?: string;
  section: string;
  timestamp: Date;
  anonymousId: string;
}

interface AnnotationToolsProps {
  annotations: Annotation[];
  onCreateAnnotation: (annotation: Omit<Annotation, 'id' | 'timestamp' | 'anonymousId'>) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  anonymousId: string;
}

/**
 * Annotation type selector
 */
function AnnotationTypeSelector({
  activeType,
  onTypeSelect,
}: {
  activeType?: string;
  onTypeSelect: (type: 'highlight' | 'comment' | 'bookmark' | 'concern') => void;
}) {
  const types = [
    {
      id: 'highlight' as const,
      label: 'Highlight',
      icon: Highlight,
      color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      description: 'Mark important text'
    },
    {
      id: 'comment' as const,
      label: 'Comment',
      icon: MessageSquare,
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      description: 'Add detailed feedback'
    },
    {
      id: 'bookmark' as const,
      label: 'Bookmark',
      icon: Bookmark,
      color: 'bg-green-100 text-green-800 hover:bg-green-200',
      description: 'Mark for later reference'
    },
    {
      id: 'concern' as const,
      label: 'Concern',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800 hover:bg-red-200',
      description: 'Flag potential issues'
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {types.map((type) => (
        <Button
          key={type.id}
          variant={activeType === type.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeSelect(type.id)}
          className={`h-auto flex-col gap-1 p-3 ${activeType !== type.id ? type.color : ''}`}
        >
          <type.icon className="h-4 w-4" />
          <div className="text-center">
            <div className="font-medium text-xs">{type.label}</div>
            <div className="text-xs opacity-70">{type.description}</div>
          </div>
        </Button>
      ))}
    </div>
  );
}

/**
 * Quick annotation creator
 */
function QuickAnnotator({
  selectedText,
  onCreateAnnotation,
}: {
  selectedText?: string;
  onCreateAnnotation: (annotation: Omit<Annotation, 'id' | 'timestamp' | 'anonymousId'>) => void;
}) {
  const [activeType, setActiveType] = useState<'highlight' | 'comment' | 'bookmark' | 'concern'>();
  const [comment, setComment] = useState('');
  const [section, setSection] = useState('introduction'); // This would be dynamic

  const handleCreate = useCallback(() => {
    if (!activeType || !selectedText) return;

    onCreateAnnotation({
      type: activeType,
      text: selectedText,
      comment: comment || undefined,
      section,
    });

    // Reset form
    setActiveType(undefined);
    setComment('');
  }, [activeType, selectedText, comment, section, onCreateAnnotation]);

  if (!selectedText) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Select text to create annotations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium mb-2">Selected Text</div>
        <div className="bg-muted p-2 rounded text-sm border-l-4 border-primary">
          "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Annotation Type</div>
        <AnnotationTypeSelector
          activeType={activeType}
          onTypeSelect={setActiveType}
        />
      </div>

      {(activeType === 'comment' || activeType === 'concern') && (
        <div>
          <div className="text-sm font-medium mb-2">
            {activeType === 'comment' ? 'Add Comment' : 'Describe Concern'}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              activeType === 'comment' 
                ? 'Add your detailed feedback...'
                : 'Describe the issue or concern...'
            }
            className="min-h-20"
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleCreate}
          disabled={!activeType}
          className="flex-1"
        >
          Create Annotation
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setActiveType(undefined);
            setComment('');
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

/**
 * Annotation list item
 */
function AnnotationListItem({
  annotation,
  onUpdate,
  onDelete,
}: {
  annotation: Annotation;
  onUpdate: (id: string, updates: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editComment, setEditComment] = useState(annotation.comment || '');

  const typeConfig = {
    highlight: { icon: Highlight, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    comment: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
    bookmark: { icon: Bookmark, color: 'text-green-600', bg: 'bg-green-50' },
    concern: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  };

  const config = typeConfig[annotation.type];
  const TypeIcon = config.icon;

  const handleSave = useCallback(() => {
    onUpdate(annotation.id, { comment: editComment });
    setIsEditing(false);
  }, [annotation.id, editComment, onUpdate]);

  return (
    <div className={`p-3 rounded-lg border ${config.bg}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <TypeIcon className={`h-4 w-4 ${config.color}`} />
          <Badge variant="outline" className="text-xs capitalize">
            {annotation.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {annotation.section}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(annotation.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="text-sm mb-2 italic">
        "{annotation.text.length > 80 
          ? annotation.text.substring(0, 80) + '...' 
          : annotation.text}"
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            placeholder="Add or edit comment..."
            className="text-sm min-h-16"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditComment(annotation.comment || '');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        annotation.comment && (
          <div className="text-sm text-muted-foreground bg-white p-2 rounded border">
            {annotation.comment}
          </div>
        )
      )}

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{annotation.timestamp.toLocaleDateString()}</span>
        </div>
        <span className="font-mono text-xs">
          {annotation.anonymousId.substring(0, 8)}
        </span>
      </div>
    </div>
  );
}

/**
 * Main annotation tools component
 */
export function AnnotationTools({
  annotations,
  onCreateAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  anonymousId,
}: AnnotationToolsProps) {
  const [selectedText, setSelectedText] = useState<string>();
  const [filter, setFilter] = useState<string>('all');

  // Filter annotations based on type
  const filteredAnnotations = annotations.filter(annotation => {
    if (filter === 'all') return true;
    return annotation.type === filter;
  });

  // Group annotations by section
  const annotationsBySection = filteredAnnotations.reduce((acc, annotation) => {
    if (!acc[annotation.section]) {
      acc[annotation.section] = [];
    }
    acc[annotation.section].push(annotation);
    return acc;
  }, {} as Record<string, Annotation[]>);

  const annotationCounts = {
    all: annotations.length,
    highlight: annotations.filter(a => a.type === 'highlight').length,
    comment: annotations.filter(a => a.type === 'comment').length,
    bookmark: annotations.filter(a => a.type === 'bookmark').length,
    concern: annotations.filter(a => a.type === 'concern').length,
  };

  return (
    <Card className="w-80 h-[800px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Annotations
          <Badge variant="secondary" className="ml-auto">
            {annotations.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Annotation creator */}
        <QuickAnnotator
          selectedText={selectedText}
          onCreateAnnotation={onCreateAnnotation}
        />

        <Separator />

        {/* Filter tabs */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Filter by Type</div>
          <div className="flex flex-wrap gap-1">
            {[
              { key: 'all', label: 'All', count: annotationCounts.all },
              { key: 'highlight', label: 'Highlights', count: annotationCounts.highlight },
              { key: 'comment', label: 'Comments', count: annotationCounts.comment },
              { key: 'bookmark', label: 'Bookmarks', count: annotationCounts.bookmark },
              { key: 'concern', label: 'Concerns', count: annotationCounts.concern },
            ].map((filterOption) => (
              <Button
                key={filterOption.key}
                variant={filter === filterOption.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption.key)}
                className="text-xs"
              >
                {filterOption.label} ({filterOption.count})
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Annotations list */}
        <div className="flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {Object.entries(annotationsBySection).map(([section, sectionAnnotations]) => (
                <div key={section}>
                  <div className="text-sm font-medium mb-2 capitalize">
                    {section} ({sectionAnnotations.length})
                  </div>
                  <div className="space-y-2">
                    {sectionAnnotations.map((annotation) => (
                      <AnnotationListItem
                        key={annotation.id}
                        annotation={annotation}
                        onUpdate={onUpdateAnnotation}
                        onDelete={onDeleteAnnotation}
                      />
                    ))}
                  </div>
                </div>
              ))}
              
              {filteredAnnotations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {filter === 'all' ? 'No annotations yet' : `No ${filter} annotations`}
                  </p>
                  <p className="text-xs mt-1">
                    Select text in the manuscript to create annotations
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

export default AnnotationTools;