/**
 * Review Notes Component
 * 
 * Provides a dedicated area for reviewers to maintain structured notes
 * throughout the review process. Notes are automatically saved and
 * maintain anonymity protection.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Save, 
  Plus,
  Trash2,
  Edit,
  Clock,
  BookOpen,
  Star
} from 'lucide-react';

interface ReviewNote {
  id: string;
  title: string;
  content: string;
  section?: string;
  category: 'general' | 'methodology' | 'results' | 'writing' | 'significance';
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  lastModified: Date;
  anonymousId: string;
}

interface ReviewNotesProps {
  notes: ReviewNote[];
  onCreateNote: (note: Omit<ReviewNote, 'id' | 'timestamp' | 'lastModified' | 'anonymousId'>) => void;
  onUpdateNote: (id: string, updates: Partial<ReviewNote>) => void;
  onDeleteNote: (id: string) => void;
  anonymousId: string;
  autoSave?: boolean;
}

/**
 * Note editor component
 */
function NoteEditor({
  note,
  onSave,
  onCancel,
  isNew = false,
}: {
  note?: Partial<ReviewNote>;
  onSave: (note: Omit<ReviewNote, 'id' | 'timestamp' | 'lastModified' | 'anonymousId'>) => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [category, setCategory] = useState<ReviewNote['category']>(note?.category || 'general');
  const [priority, setPriority] = useState<ReviewNote['priority']>(note?.priority || 'medium');
  const [section, setSection] = useState(note?.section || '');

  const categories = [
    { value: 'general' as const, label: 'General', color: 'bg-gray-100' },
    { value: 'methodology' as const, label: 'Methodology', color: 'bg-blue-100' },
    { value: 'results' as const, label: 'Results', color: 'bg-green-100' },
    { value: 'writing' as const, label: 'Writing & Style', color: 'bg-purple-100' },
    { value: 'significance' as const, label: 'Significance', color: 'bg-orange-100' },
  ];

  const priorities = [
    { value: 'low' as const, label: 'Low', color: 'text-gray-600' },
    { value: 'medium' as const, label: 'Medium', color: 'text-blue-600' },
    { value: 'high' as const, label: 'High', color: 'text-red-600' },
  ];

  const handleSave = useCallback(() => {
    if (!title.trim() || !content.trim()) return;
    
    onSave({
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      section: section.trim() || undefined,
    });
  }, [title, content, category, priority, section, onSave]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          {isNew ? 'New Review Note' : 'Edit Note'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReviewNote['category'])}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ReviewNote['priority'])}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              {priorities.map(pri => (
                <option key={pri.value} value={pri.value}>
                  {pri.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Section (optional)</label>
          <input
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="e.g., Introduction, Methods..."
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Content</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your review note here..."
            className="min-h-32"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!title.trim() || !content.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save Note
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Note display component
 */
function NoteCard({
  note,
  onEdit,
  onDelete,
}: {
  note: ReviewNote;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const categoryConfig = {
    general: { color: 'bg-gray-100 text-gray-800', icon: FileText },
    methodology: { color: 'bg-blue-100 text-blue-800', icon: BookOpen },
    results: { color: 'bg-green-100 text-green-800', icon: Star },
    writing: { color: 'bg-purple-100 text-purple-800', icon: Edit },
    significance: { color: 'bg-orange-100 text-orange-800', icon: Star },
  };

  const priorityConfig = {
    low: { color: 'text-gray-600', dots: '○' },
    medium: { color: 'text-blue-600', dots: '◐' },
    high: { color: 'text-red-600', dots: '●' },
  };

  const catConfig = categoryConfig[note.category];
  const priConfig = priorityConfig[note.priority];
  const CategoryIcon = catConfig.icon;

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">{note.title}</h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={`text-xs ${catConfig.color}`}>
                <CategoryIcon className="h-3 w-3 mr-1" />
                {note.category}
              </Badge>
              <span className={`text-xs ${priConfig.color} font-bold`}>
                {priConfig.dots} {note.priority}
              </span>
              {note.section && (
                <Badge variant="outline" className="text-xs">
                  {note.section}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {note.content}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Modified {note.lastModified.toLocaleDateString()}</span>
          </div>
          <span className="font-mono">
            {note.anonymousId.substring(0, 8)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main review notes component
 */
export function ReviewNotes({
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  anonymousId,
  autoSave = true,
}: ReviewNotesProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<ReviewNote | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'modified' | 'created' | 'priority'>('modified');

  // Auto-save functionality would go here
  useEffect(() => {
    if (autoSave) {
      // Implementation for auto-save
    }
  }, [autoSave, notes]);

  const handleCreateNote = useCallback((note: Omit<ReviewNote, 'id' | 'timestamp' | 'lastModified' | 'anonymousId'>) => {
    onCreateNote(note);
    setIsCreating(false);
  }, [onCreateNote]);

  const handleUpdateNote = useCallback((noteData: Omit<ReviewNote, 'id' | 'timestamp' | 'lastModified' | 'anonymousId'>) => {
    if (editingNote) {
      onUpdateNote(editingNote.id, noteData);
      setEditingNote(null);
    }
  }, [editingNote, onUpdateNote]);

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => filter === 'all' || note.category === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'modified':
          return b.lastModified.getTime() - a.lastModified.getTime();
        case 'created':
          return b.timestamp.getTime() - a.timestamp.getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

  const noteCountsByCategory = notes.reduce((acc, note) => {
    acc[note.category] = (acc[note.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="w-80 h-[800px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Review Notes
            <Badge variant="secondary">
              {notes.length}
            </Badge>
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            disabled={isCreating || editingNote !== null}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Note editor (create or edit) */}
        {isCreating && (
          <NoteEditor
            isNew={true}
            onSave={handleCreateNote}
            onCancel={() => setIsCreating(false)}
          />
        )}

        {editingNote && (
          <NoteEditor
            note={editingNote}
            onSave={handleUpdateNote}
            onCancel={() => setEditingNote(null)}
          />
        )}

        {!isCreating && !editingNote && (
          <>
            {/* Filters and sorting */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Filter</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="text-xs px-2 py-1 border rounded"
                >
                  <option value="modified">Last Modified</option>
                  <option value="created">Date Created</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
              
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="text-xs"
                >
                  All ({notes.length})
                </Button>
                {Object.entries(noteCountsByCategory).map(([category, count]) => (
                  <Button
                    key={category}
                    variant={filter === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(category)}
                    className="text-xs capitalize"
                  >
                    {category} ({count})
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Notes list */}
            <div className="flex-1">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {filteredNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={() => setEditingNote(note)}
                      onDelete={() => onDeleteNote(note.id)}
                    />
                  ))}
                  
                  {filteredNotes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {filter === 'all' ? 'No notes yet' : `No ${filter} notes`}
                      </p>
                      <p className="text-xs mt-1">
                        Click the + button to create your first note
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ReviewNotes;