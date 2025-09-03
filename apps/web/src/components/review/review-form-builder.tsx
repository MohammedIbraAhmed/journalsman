/**
 * Review Form Builder Component
 * 
 * Dynamically builds journal-specific review forms with customizable criteria
 * and evaluation templates. Supports various field types and validation rules
 * while maintaining reviewer anonymity.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Star,
  CheckCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  Scale,
  ThumbsUp,
  ThumbsDown,
  Info
} from 'lucide-react';

interface FormField {
  id: string;
  type: 'rating' | 'text' | 'textarea' | 'select' | 'boolean' | 'recommendation';
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
  value?: any;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

interface FormSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  fields: FormField[];
}

interface ReviewFormBuilderProps {
  sections: Array<{
    id: string;
    title: string;
    required: boolean;
    completed: boolean;
    description?: string;
  }>;
  journalId: string;
  anonymousId: string;
  onSectionComplete: (sectionId: string) => void;
  onFormChange: (data: Record<string, any>) => void;
}

/**
 * Rating scale component
 */
function RatingScale({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value?: number;
  onChange: (value: number) => void;
}) {
  const min = field.min || 1;
  const max = field.max || 5;
  const ratings = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const getScaleLabel = (rating: number) => {
    const scale = max - min + 1;
    if (scale === 5) {
      const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
      return labels[rating - min];
    } else if (scale === 10) {
      if (rating <= 3) return 'Poor';
      if (rating <= 5) return 'Fair';
      if (rating <= 7) return 'Good';
      if (rating <= 9) return 'Very Good';
      return 'Excellent';
    }
    return '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Poor</span>
        <span className="text-muted-foreground">Excellent</span>
      </div>
      
      <div className="flex gap-2">
        {ratings.map((rating) => (
          <Button
            key={rating}
            variant={value === rating ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(rating)}
            className="flex-1 h-12 flex flex-col gap-1"
          >
            <span className="font-bold">{rating}</span>
            <span className="text-xs">{getScaleLabel(rating)}</span>
          </Button>
        ))}
      </div>
      
      {value && (
        <div className="text-center text-sm text-muted-foreground">
          Selected: {value}/5 - {getScaleLabel(value)}
        </div>
      )}
    </div>
  );
}

/**
 * Recommendation component
 */
function RecommendationField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value?: string;
  onChange: (value: string) => void;
}) {
  const recommendations = [
    {
      value: 'accept',
      label: 'Accept',
      description: 'Accept without revision',
      icon: CheckCircle,
      color: 'text-green-600 border-green-200 bg-green-50'
    },
    {
      value: 'minor_revisions',
      label: 'Minor Revisions',
      description: 'Accept with minor revisions',
      icon: FileText,
      color: 'text-blue-600 border-blue-200 bg-blue-50'
    },
    {
      value: 'major_revisions',
      label: 'Major Revisions',
      description: 'Major revisions required',
      icon: AlertCircle,
      color: 'text-orange-600 border-orange-200 bg-orange-50'
    },
    {
      value: 'reject',
      label: 'Reject',
      description: 'Reject without revision',
      icon: ThumbsDown,
      color: 'text-red-600 border-red-200 bg-red-50'
    },
  ];

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <Button
          key={rec.value}
          variant={value === rec.value ? 'default' : 'outline'}
          onClick={() => onChange(rec.value)}
          className={`w-full h-auto p-4 justify-start ${
            value !== rec.value ? rec.color : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <rec.icon className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">{rec.label}</div>
              <div className="text-sm opacity-70">{rec.description}</div>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}

/**
 * Form field renderer
 */
function FormFieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value?: any;
  onChange: (value: any) => void;
  error?: string;
}) {
  const renderField = () => {
    switch (field.type) {
      case 'rating':
        return (
          <RatingScale
            field={field}
            value={value}
            onChange={onChange}
          />
        );

      case 'recommendation':
        return (
          <RecommendationField
            field={field}
            value={value}
            onChange={onChange}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`min-h-32 ${error ? 'border-red-500' : ''}`}
          />
        );

      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-md ${
              error ? 'border-red-500' : 'border-input'
            }`}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              error ? 'border-red-500' : 'border-input'
            }`}
          >
            <option value="">Select an option...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <div className="flex gap-4">
            <Button
              variant={value === true ? 'default' : 'outline'}
              onClick={() => onChange(true)}
              className="flex-1"
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Yes
            </Button>
            <Button
              variant={value === false ? 'default' : 'outline'}
              onClick={() => onChange(false)}
              className="flex-1"
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              No
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <label className="text-sm font-medium flex items-center gap-2">
            {field.label}
            {field.required && <Star className="h-3 w-3 text-orange-500" />}
          </label>
          {field.description && (
            <p className="text-sm text-muted-foreground">
              {field.description}
            </p>
          )}
        </div>
      </div>
      
      {renderField()}
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Form section component
 */
function FormSectionRenderer({
  section,
  formData,
  onFieldChange,
  errors,
}: {
  section: FormSection;
  formData: Record<string, any>;
  onFieldChange: (fieldId: string, value: any) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {section.title}
          {section.required && <Star className="h-4 w-4 text-orange-500" />}
          {section.completed && <CheckCircle className="h-4 w-4 text-green-500" />}
        </h3>
        <p className="text-muted-foreground">{section.description}</p>
      </div>

      <div className="space-y-8">
        {section.fields.map((field) => (
          <FormFieldRenderer
            key={field.id}
            field={field}
            value={formData[field.id]}
            onChange={(value) => onFieldChange(field.id, value)}
            error={errors[field.id]}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Main review form builder component
 */
export function ReviewFormBuilder({
  sections: sectionMeta,
  journalId,
  anonymousId,
  onSectionComplete,
  onFormChange,
}: ReviewFormBuilderProps) {
  // Mock detailed form sections - would be loaded from journal configuration
  const [sections] = useState<FormSection[]>([
    {
      id: 'significance',
      title: 'Scientific Significance',
      description: 'Evaluate the novelty and importance of the research contribution',
      required: true,
      completed: false,
      fields: [
        {
          id: 'novelty_rating',
          type: 'rating',
          label: 'Novelty and Originality',
          description: 'How novel and original is this research contribution?',
          required: true,
          min: 1,
          max: 5,
        },
        {
          id: 'significance_rating',
          type: 'rating',
          label: 'Scientific Significance',
          description: 'How significant is this work to the field?',
          required: true,
          min: 1,
          max: 5,
        },
        {
          id: 'novelty_comments',
          type: 'textarea',
          label: 'Comments on Novelty and Significance',
          description: 'Please elaborate on your ratings above',
          required: true,
          placeholder: 'Describe the novelty and significance of this research...',
          validation: { minLength: 100 },
        },
      ],
    },
    {
      id: 'methodology',
      title: 'Methodology Assessment',
      description: 'Review the experimental design and analytical approaches',
      required: true,
      completed: false,
      fields: [
        {
          id: 'experimental_design',
          type: 'rating',
          label: 'Experimental Design Quality',
          description: 'Rate the quality of the experimental design',
          required: true,
          min: 1,
          max: 5,
        },
        {
          id: 'statistical_methods',
          type: 'rating',
          label: 'Statistical Methods Appropriateness',
          description: 'Are the statistical methods appropriate and properly applied?',
          required: true,
          min: 1,
          max: 5,
        },
        {
          id: 'data_quality',
          type: 'boolean',
          label: 'Data Quality and Completeness',
          description: 'Is the data of sufficient quality and completeness?',
          required: true,
        },
        {
          id: 'methodology_comments',
          type: 'textarea',
          label: 'Detailed Methodology Comments',
          description: 'Provide detailed feedback on the methodology',
          required: true,
          placeholder: 'Comment on the experimental design, methods, data collection, analysis...',
          validation: { minLength: 200 },
        },
      ],
    },
    {
      id: 'recommendation',
      title: 'Final Recommendation',
      description: 'Provide your overall assessment and recommendation',
      required: true,
      completed: false,
      fields: [
        {
          id: 'overall_recommendation',
          type: 'recommendation',
          label: 'Editorial Recommendation',
          description: 'What is your recommendation for this manuscript?',
          required: true,
        },
        {
          id: 'recommendation_rationale',
          type: 'textarea',
          label: 'Rationale for Recommendation',
          description: 'Explain the reasoning behind your recommendation',
          required: true,
          placeholder: 'Provide a clear rationale for your recommendation...',
          validation: { minLength: 150 },
        },
        {
          id: 'revision_suggestions',
          type: 'textarea',
          label: 'Specific Revision Suggestions',
          description: 'If revisions are needed, provide specific suggestions',
          required: false,
          placeholder: 'List specific changes or improvements needed...',
        },
      ],
    },
  ]);

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const currentSection = sections[currentSectionIndex];

  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error when field is updated
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }

    onFormChange({ ...formData, [fieldId]: value });
  }, [formData, errors, onFormChange]);

  const validateField = useCallback((field: FormField, value: any): string | null => {
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return 'This field is required';
    }

    if (field.validation && typeof value === 'string') {
      if (field.validation.minLength && value.length < field.validation.minLength) {
        return `Minimum ${field.validation.minLength} characters required`;
      }
      if (field.validation.maxLength && value.length > field.validation.maxLength) {
        return `Maximum ${field.validation.maxLength} characters allowed`;
      }
    }

    return null;
  }, []);

  const validateCurrentSection = useCallback(() => {
    const sectionErrors: Record<string, string> = {};
    
    currentSection.fields.forEach(field => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        sectionErrors[field.id] = error;
      }
    });

    setErrors(prev => ({ ...prev, ...sectionErrors }));
    return Object.keys(sectionErrors).length === 0;
  }, [currentSection, formData, validateField]);

  const goToNextSection = useCallback(() => {
    if (validateCurrentSection()) {
      onSectionComplete(currentSection.id);
      if (currentSectionIndex < sections.length - 1) {
        setCurrentSectionIndex(prev => prev + 1);
      }
    }
  }, [currentSectionIndex, sections.length, validateCurrentSection, onSectionComplete, currentSection.id]);

  const goToPreviousSection = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  }, [currentSectionIndex]);

  return (
    <div className="space-y-6">
      {/* Section navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Section {currentSectionIndex + 1} of {sections.length}
          </Badge>
          {currentSection.required && (
            <Badge variant="secondary">
              <Star className="h-3 w-3 mr-1" />
              Required
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousSection}
            disabled={currentSectionIndex === 0}
          >
            Previous
          </Button>
          <Button
            size="sm"
            onClick={goToNextSection}
            disabled={currentSectionIndex === sections.length - 1}
          >
            {currentSectionIndex === sections.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Current section content */}
      <FormSectionRenderer
        section={currentSection}
        formData={formData}
        onFieldChange={handleFieldChange}
        errors={errors}
      />

      {/* Section navigation (repeated at bottom for long forms) */}
      <div className="flex justify-center pt-6">
        <div className="flex gap-2">
          {sections.map((_, index) => (
            <Button
              key={index}
              variant={index === currentSectionIndex ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentSectionIndex(index)}
              className="w-8 h-8 p-0"
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReviewFormBuilder;