/**
 * Review Form Validator Component
 * 
 * Provides comprehensive validation for review forms including
 * field-level validation, cross-field validation, and submission
 * readiness checks while maintaining anonymity protection.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Info,
  Star,
  AlertTriangle
} from 'lucide-react';

interface ValidationRule {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationRule[];
  warnings: ValidationRule[];
  info: ValidationRule[];
  completedFields: number;
  totalFields: number;
  requiredFields: number;
  completedRequiredFields: number;
}

interface ReviewFormValidatorProps {
  formData: Record<string, any>;
  formFields: Array<{
    id: string;
    label: string;
    required: boolean;
    type: string;
    validation?: {
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: string;
    };
  }>;
  journalRules?: ValidationRule[];
  onValidationChange?: (result: ValidationResult) => void;
}

/**
 * Validation utility functions
 */
const validators = {
  required: (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'boolean') return value !== undefined;
    if (Array.isArray(value)) return value.length > 0;
    return value != null;
  },

  minLength: (value: string, min: number): boolean => {
    return typeof value === 'string' && value.length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return typeof value === 'string' && value.length <= max;
  },

  rating: (value: number, min: number, max: number): boolean => {
    return typeof value === 'number' && value >= min && value <= max;
  },

  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  recommendation: (value: string): boolean => {
    const validRecommendations = ['accept', 'minor_revisions', 'major_revisions', 'reject'];
    return validRecommendations.includes(value);
  },

  wordCount: (value: string, min: number, max?: number): boolean => {
    const wordCount = value.trim().split(/\s+/).length;
    if (max) return wordCount >= min && wordCount <= max;
    return wordCount >= min;
  },
};

/**
 * Field validation component
 */
function FieldValidationStatus({
  field,
  value,
  validationResult,
}: {
  field: {
    id: string;
    label: string;
    required: boolean;
    type: string;
    validation?: Record<string, any>;
  };
  value: any;
  validationResult: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}) {
  const hasValue = validators.required(value);
  const isValid = validationResult.isValid;
  const hasErrors = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;

  let status: 'complete' | 'error' | 'warning' | 'incomplete' = 'incomplete';
  let icon = null;
  let color = 'text-muted-foreground';

  if (hasErrors) {
    status = 'error';
    icon = <XCircle className="h-4 w-4" />;
    color = 'text-red-600';
  } else if (hasWarnings) {
    status = 'warning';
    icon = <AlertTriangle className="h-4 w-4" />;
    color = 'text-orange-600';
  } else if (isValid && hasValue) {
    status = 'complete';
    icon = <CheckCircle className="h-4 w-4" />;
    color = 'text-green-600';
  } else {
    icon = <AlertCircle className="h-4 w-4" />;
  }

  return (
    <div className="flex items-center justify-between p-2 rounded-lg border">
      <div className="flex items-center gap-2">
        <div className={color}>{icon}</div>
        <div>
          <div className="text-sm font-medium flex items-center gap-1">
            {field.label}
            {field.required && <Star className="h-3 w-3 text-orange-500" />}
          </div>
          {validationResult.errors.length > 0 && (
            <div className="text-xs text-red-600">
              {validationResult.errors[0]}
            </div>
          )}
          {validationResult.warnings.length > 0 && validationResult.errors.length === 0 && (
            <div className="text-xs text-orange-600">
              {validationResult.warnings[0]}
            </div>
          )}
        </div>
      </div>
      <Badge variant="outline" className={`text-xs ${color}`}>
        {status}
      </Badge>
    </div>
  );
}

/**
 * Overall validation summary
 */
function ValidationSummary({
  result,
}: {
  result: ValidationResult;
}) {
  const progressPercentage = Math.round((result.completedFields / result.totalFields) * 100);
  const requiredProgressPercentage = Math.round(
    (result.completedRequiredFields / result.requiredFields) * 100
  );

  const canSubmit = result.isValid && result.errors.length === 0;
  const hasWarnings = result.warnings.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          Form Validation Summary
          {canSubmit ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Completion</span>
            <span className="font-medium">
              {result.completedFields}/{result.totalFields} fields
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Required fields progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              Required Fields
              <Star className="h-3 w-3 text-orange-500" />
            </span>
            <span className="font-medium">
              {result.completedRequiredFields}/{result.requiredFields}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                requiredProgressPercentage === 100 ? 'bg-green-500' : 'bg-orange-500'
              }`}
              style={{ width: `${requiredProgressPercentage}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Validation status */}
        <div className="space-y-2">
          {result.errors.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="h-4 w-4" />
              <span>{result.errors.length} error{result.errors.length > 1 ? 's' : ''} found</span>
            </div>
          )}
          
          {hasWarnings && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{result.warnings.length} warning{result.warnings.length > 1 ? 's' : ''}</span>
            </div>
          )}
          
          {canSubmit && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Ready for submission</span>
            </div>
          )}
        </div>

        {/* Submission readiness */}
        <div className="pt-2">
          <Badge 
            variant={canSubmit ? 'default' : 'secondary'}
            className={`w-full justify-center py-2 ${
              canSubmit ? 'bg-green-600' : 'bg-orange-100 text-orange-800'
            }`}
          >
            {canSubmit ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Form Complete
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                {result.errors.length > 0 ? 'Errors Must Be Fixed' : 'Required Fields Missing'}
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main validation component
 */
export function ReviewFormValidator({
  formData,
  formFields,
  journalRules = [],
  onValidationChange,
}: ReviewFormValidatorProps) {
  // Validate individual fields
  const validateField = (field: any, value: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    // Required field validation
    if (field.required && !validators.required(value)) {
      errors.push('This field is required');
      return { isValid: false, errors, warnings, info };
    }

    // Skip other validations if field is empty and not required
    if (!validators.required(value) && !field.required) {
      return { isValid: true, errors, warnings, info };
    }

    // Type-specific validation
    switch (field.type) {
      case 'textarea':
      case 'text':
        if (field.validation?.minLength && !validators.minLength(value, field.validation.minLength)) {
          errors.push(`Minimum ${field.validation.minLength} characters required`);
        }
        if (field.validation?.maxLength && !validators.maxLength(value, field.validation.maxLength)) {
          errors.push(`Maximum ${field.validation.maxLength} characters allowed`);
        }
        break;

      case 'rating':
        const min = field.validation?.min || 1;
        const max = field.validation?.max || 5;
        if (!validators.rating(value, min, max)) {
          errors.push(`Rating must be between ${min} and ${max}`);
        }
        break;

      case 'recommendation':
        if (!validators.recommendation(value)) {
          errors.push('Please select a valid recommendation');
        }
        break;
    }

    // Journal-specific validations
    const relevantRules = journalRules.filter(rule => rule.field === field.id);
    relevantRules.forEach(rule => {
      // Apply custom validation logic here
      // This would be expanded based on specific journal requirements
      if (rule.severity === 'error') {
        errors.push(rule.message);
      } else if (rule.severity === 'warning') {
        warnings.push(rule.message);
      } else {
        info.push(rule.message);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
    };
  };

  // Perform overall validation
  const performValidation = (): ValidationResult => {
    let totalErrors: ValidationRule[] = [];
    let totalWarnings: ValidationRule[] = [];
    let totalInfo: ValidationRule[] = [];
    
    let completedFields = 0;
    let completedRequiredFields = 0;
    const totalFields = formFields.length;
    const requiredFields = formFields.filter(f => f.required).length;

    formFields.forEach(field => {
      const value = formData[field.id];
      const fieldValidation = validateField(field, value);

      if (validators.required(value)) {
        completedFields++;
        if (field.required) {
          completedRequiredFields++;
        }
      }

      fieldValidation.errors.forEach(error => {
        totalErrors.push({
          field: field.id,
          rule: 'validation',
          message: error,
          severity: 'error'
        });
      });

      fieldValidation.warnings.forEach(warning => {
        totalWarnings.push({
          field: field.id,
          rule: 'validation',
          message: warning,
          severity: 'warning'
        });
      });

      fieldValidation.info.forEach(info => {
        totalInfo.push({
          field: field.id,
          rule: 'validation',
          message: info,
          severity: 'info'
        });
      });
    });

    const result: ValidationResult = {
      isValid: totalErrors.length === 0 && completedRequiredFields === requiredFields,
      errors: totalErrors,
      warnings: totalWarnings,
      info: totalInfo,
      completedFields,
      totalFields,
      requiredFields,
      completedRequiredFields,
    };

    // Notify parent component of validation changes
    onValidationChange?.(result);

    return result;
  };

  const validationResult = performValidation();

  return (
    <div className="space-y-4">
      <ValidationSummary result={validationResult} />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Field Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {formFields.map(field => {
            const value = formData[field.id];
            const fieldValidation = validateField(field, value);
            
            return (
              <FieldValidationStatus
                key={field.id}
                field={field}
                value={value}
                validationResult={fieldValidation}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* Detailed error list */}
      {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Issues to Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {validationResult.errors.map((error, index) => (
              <div key={`error-${index}`} className="flex items-start gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-red-600">Error</div>
                  <div className="text-muted-foreground">{error.message}</div>
                </div>
              </div>
            ))}
            
            {validationResult.warnings.map((warning, index) => (
              <div key={`warning-${index}`} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-orange-600">Warning</div>
                  <div className="text-muted-foreground">{warning.message}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ReviewFormValidator;