# Synfind Platform - Multi-Tenant Branding System

## Overview

This document defines the comprehensive multi-tenant branding system for the Synfind academic publishing platform, enabling journal-specific identity preservation while maintaining consistent platform usability patterns. The system supports unlimited journal customization within publisher accounts while ensuring accessibility, performance, and user experience consistency across all academic workflows.

## Multi-Tenant Branding Architecture

### Core Branding Principles

1. **Identity Preservation**: Each journal maintains distinct visual identity and brand recognition
2. **Usability Consistency**: Navigation patterns and interaction behaviors remain consistent across journals
3. **Accessibility Compliance**: All customizations maintain WCAG 2.1 AA compliance automatically
4. **Performance Optimization**: Branding assets optimized for global academic community performance
5. **Cultural Adaptation**: Branding system accommodates international academic institutions and cultural preferences

### Branding Hierarchy Structure

```
Publisher Level (Synfind Platform)
├── Publisher Brand Settings
│   ├── Logo and Corporate Colors
│   ├── Typography Preferences
│   └── Contact Information
│
└── Journal Level (Individual Journals)
    ├── Journal Identity
    │   ├── Journal Logo
    │   ├── Color Palette
    │   ├── Typography
    │   └── Custom Domain
    │
    ├── Content Customization
    │   ├── Submission Guidelines
    │   ├── Review Criteria
    │   ├── Email Templates
    │   └── Author Instructions
    │
    └── Interface Customization
        ├── Header Layout
        ├── Navigation Labels
        ├── Footer Content
        └── Sidebar Configuration
```

## Dynamic Theming System

### CSS Custom Properties Architecture

```css
/* Base Academic Theme Variables */
:root {
  /* Platform foundation (unchangeable) */
  --synfind-platform-font: "Inter", sans-serif;
  --synfind-spacing-scale: 1;
  --synfind-border-radius: 6px;
  --synfind-shadow-base: 0 1px 3px rgba(0, 0, 0, 0.12);

  /* Journal customizable variables */
  --journal-primary: #0ea5e9;        /* Customizable */
  --journal-secondary: #64748b;      /* Customizable */
  --journal-accent: #f59e0b;         /* Customizable */
  --journal-background: #ffffff;     /* Customizable */
  --journal-surface: #f8fafc;       /* Customizable */
  
  /* Journal typography (customizable) */
  --journal-font-primary: "Inter", sans-serif;
  --journal-font-headings: "Inter", serif;
  --journal-font-manuscript: "Crimson Text", serif;
  
  /* Computed accessibility-compliant colors */
  --journal-primary-contrast: var(--journal-primary-accessible);
  --journal-text-on-primary: var(--journal-primary-text);
  --journal-border: var(--journal-primary-border);
}

/* Journal-specific theme overrides */
[data-journal-theme="nature-chemistry"] {
  --journal-primary: #dc2626;
  --journal-secondary: #991b1b;
  --journal-accent: #fbbf24;
  --journal-font-headings: "Crimson Text", serif;
}

[data-journal-theme="ieee-transactions"] {
  --journal-primary: #1e40af;
  --journal-secondary: #1e3a8a;
  --journal-accent: #3b82f6;
  --journal-font-primary: "Roboto", sans-serif;
}

[data-journal-theme="plos-one"] {
  --journal-primary: #f97316;
  --journal-secondary: #ea580c;
  --journal-accent: #84cc16;
  --journal-font-headings: "Source Sans Pro", sans-serif;
}

/* Academic component theming */
.academic-card {
  background: var(--journal-background);
  border: 1px solid var(--journal-border);
  color: var(--journal-text-primary);
}

.academic-button-primary {
  background: var(--journal-primary);
  color: var(--journal-text-on-primary);
  border: 1px solid var(--journal-primary);
}

.academic-button-primary:hover {
  background: var(--journal-primary-hover);
  border-color: var(--journal-primary-hover);
}

.academic-header {
  background: var(--journal-primary);
  color: var(--journal-text-on-primary);
}

.academic-sidebar {
  background: var(--journal-surface);
  border-right: 1px solid var(--journal-border);
}
```

### Dynamic Theme Manager

```jsx
const useJournalTheming = (journalId) => {
  const [theme, setTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJournalTheme = async () => {
      try {
        const journalTheme = await fetchJournalTheme(journalId);
        
        // Validate and process theme
        const processedTheme = processJournalTheme(journalTheme);
        
        // Apply theme to document
        applyJournalTheme(processedTheme);
        
        setTheme(processedTheme);
      } catch (error) {
        console.error('Failed to load journal theme:', error);
        // Fall back to default academic theme
        applyDefaultAcademicTheme();
      } finally {
        setIsLoading(false);
      }
    };

    if (journalId) {
      loadJournalTheme();
    }
  }, [journalId]);

  const applyJournalTheme = (theme) => {
    const root = document.documentElement;
    
    // Apply journal theme identifier
    root.setAttribute('data-journal-theme', theme.id);
    
    // Set custom properties
    Object.entries(theme.cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Update favicon and app icons
    updateJournalIcons(theme.icons);
    
    // Update document title and meta tags
    updateJournalMetadata(theme.metadata);
  };

  return { theme, isLoading, applyJournalTheme };
};

const processJournalTheme = (rawTheme) => {
  // Ensure accessibility compliance
  const accessibleColors = ensureColorAccessibility(rawTheme.colors);
  
  // Generate hover and active states
  const interactionColors = generateInteractionStates(accessibleColors);
  
  // Create CSS custom properties
  const cssVariables = {
    '--journal-primary': accessibleColors.primary,
    '--journal-secondary': accessibleColors.secondary,
    '--journal-accent': accessibleColors.accent,
    '--journal-background': accessibleColors.background,
    '--journal-surface': accessibleColors.surface,
    '--journal-primary-hover': interactionColors.primaryHover,
    '--journal-primary-active': interactionColors.primaryActive,
    '--journal-text-primary': accessibleColors.textPrimary,
    '--journal-text-secondary': accessibleColors.textSecondary,
    '--journal-border': accessibleColors.border,
    '--journal-font-primary': rawTheme.typography.primary,
    '--journal-font-headings': rawTheme.typography.headings,
    '--journal-font-manuscript': rawTheme.typography.manuscript
  };

  return {
    id: rawTheme.id,
    name: rawTheme.name,
    cssVariables,
    icons: rawTheme.icons,
    metadata: rawTheme.metadata,
    customComponents: rawTheme.customComponents || {}
  };
};

// Accessibility compliance enforcement
const ensureColorAccessibility = (colors) => {
  const ensureContrast = (foreground, background, level = 'AA') => {
    const contrastRatio = calculateContrastRatio(foreground, background);
    const requiredRatio = level === 'AAA' ? 7 : 4.5;
    
    if (contrastRatio < requiredRatio) {
      // Automatically adjust color to meet accessibility requirements
      return adjustColorForContrast(foreground, background, requiredRatio);
    }
    
    return foreground;
  };

  return {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.surface,
    textPrimary: ensureContrast(colors.textPrimary || '#000000', colors.background),
    textSecondary: ensureContrast(colors.textSecondary || '#666666', colors.background),
    textOnPrimary: ensureContrast('#ffffff', colors.primary),
    border: ensureContrast(colors.border || '#e2e8f0', colors.background)
  };
};
```

## Journal Branding Components

### Branded Header Component

```jsx
const JournalBrandedHeader = ({ journal, user, navigation }) => {
  const { theme } = useJournalTheming(journal.id);
  
  return (
    <header 
      className="academic-header sticky top-0 z-40 border-b"
      style={{
        background: `var(--journal-primary)`,
        borderColor: `var(--journal-border)`
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Journal Branding */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              {journal.logo ? (
                <img 
                  src={journal.logo.url} 
                  alt={journal.name}
                  className="h-8 w-auto"
                  style={{ maxHeight: '32px' }}
                />
              ) : (
                <div 
                  className="h-8 w-8 rounded flex items-center justify-center text-sm font-bold"
                  style={{ 
                    background: 'var(--journal-accent)',
                    color: 'var(--journal-text-on-primary)'
                  }}
                >
                  {journal.name.charAt(0)}
                </div>
              )}
              
              <div className="hidden md:block">
                <h1 
                  className="text-lg font-semibold truncate max-w-xs"
                  style={{ color: 'var(--journal-text-on-primary)' }}
                >
                  {journal.name}
                </h1>
                {journal.subtitle && (
                  <p 
                    className="text-xs opacity-90 truncate max-w-xs"
                    style={{ color: 'var(--journal-text-on-primary)' }}
                  >
                    {journal.subtitle}
                  </p>
                )}
              </div>
            </Link>
          </div>

          {/* Platform Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:opacity-80 ${
                  item.active ? 'border-b-2' : ''
                }`}
                style={{ 
                  color: 'var(--journal-text-on-primary)',
                  borderColor: item.active ? 'var(--journal-accent)' : 'transparent'
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <NotificationBell theme={theme} />
            <UserMenu theme={theme} user={user} />
          </div>
        </div>
      </div>
    </header>
  );
};
```

### Themed Academic Cards

```jsx
const ThemedAcademicCard = ({ 
  children, 
  variant = 'default', 
  className = '',
  ...props 
}) => {
  const cardVariants = {
    default: 'academic-card',
    elevated: 'academic-card-elevated',
    manuscript: 'academic-card-manuscript',
    ai: 'academic-card-ai',
    urgent: 'academic-card-urgent'
  };

  return (
    <div 
      className={`${cardVariants[variant]} ${className}`}
      style={{
        background: variant === 'ai' 
          ? 'var(--confidence-bg)' 
          : 'var(--journal-background)',
        borderColor: variant === 'urgent' 
          ? 'var(--status-revision)' 
          : 'var(--journal-border)',
        color: 'var(--journal-text-primary)'
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const ThemedSubmissionCard = ({ submission, showActions = true }) => {
  return (
    <ThemedAcademicCard 
      variant={submission.urgent ? 'urgent' : 'manuscript'}
      className="hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="p-4 space-y-3">
        {/* Header with status */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold text-sm leading-5 line-clamp-2"
              style={{ color: 'var(--journal-text-primary)' }}
            >
              {submission.title}
            </h3>
            <p 
              className="text-sm mt-1 line-clamp-1"
              style={{ color: 'var(--journal-text-secondary)' }}
            >
              {submission.authors.join(', ')}
            </p>
          </div>
          
          <StatusBadge 
            status={submission.status}
            urgent={submission.urgent}
            theme="journal"
          />
        </div>

        {/* AI Recommendation - Themed */}
        {submission.aiRecommendation && (
          <ThemedAcademicCard variant="ai" className="p-2">
            <div className="flex items-center gap-2">
              <Icon 
                name="ai-suggestion" 
                className="w-3 h-3"
                style={{ color: 'var(--confidence-high)' }}
              />
              <span 
                className="text-xs font-medium"
                style={{ color: 'var(--journal-text-primary)' }}
              >
                AI: {submission.aiRecommendation.action}
              </span>
              <Badge 
                variant="outline" 
                className="text-xs ml-auto"
                style={{ 
                  borderColor: 'var(--confidence-high)',
                  color: 'var(--confidence-high)'
                }}
              >
                {submission.aiRecommendation.confidence}%
              </Badge>
            </div>
          </ThemedAcademicCard>
        )}

        {/* Metadata */}
        <div 
          className="flex items-center justify-between text-xs"
          style={{ color: 'var(--journal-text-secondary)' }}
        >
          <span>Submitted {submission.submittedDate}</span>
          <span className={submission.daysRemaining <= 3 ? 'font-medium text-red-600' : ''}>
            {submission.daysRemaining} days remaining
          </span>
        </div>

        {/* Actions - Themed buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <ThemedButton size="sm" className="flex-1">
              <Eye className="w-3 h-3 mr-1" />
              View
            </ThemedButton>
            {submission.aiRecommendation && (
              <ThemedButton size="sm" variant="outline">
                Accept AI
              </ThemedButton>
            )}
          </div>
        )}
      </div>
    </ThemedAcademicCard>
  );
};

const ThemedButton = ({ 
  children, 
  variant = 'primary', 
  size = 'default',
  className = '',
  ...props 
}) => {
  const baseStyles = 'transition-all duration-200 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'academic-button-primary',
    secondary: 'academic-button-secondary',
    outline: 'academic-button-outline',
    ghost: 'academic-button-ghost'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      style={{
        background: variant === 'primary' ? 'var(--journal-primary)' : undefined,
        color: variant === 'primary' ? 'var(--journal-text-on-primary)' : undefined,
        borderColor: variant === 'outline' ? 'var(--journal-primary)' : undefined
      }}
      {...props}
    >
      {children}
    </button>
  );
};
```

## Journal Customization Interface

### Brand Settings Management

```jsx
const JournalBrandSettings = ({ journal, onSave }) => {
  const [brandSettings, setBrandSettings] = useState({
    logo: journal.logo,
    colors: journal.colors || defaultAcademicColors,
    typography: journal.typography || defaultAcademicTypography,
    customDomain: journal.customDomain,
    favicon: journal.favicon,
    socialMedia: journal.socialMedia || {}
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleColorChange = (colorKey, newColor) => {
    setBrandSettings(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: newColor
      }
    }));
  };

  const handleLogoUpload = async (file) => {
    setIsUploading(true);
    try {
      // Validate image format and size
      if (!validateImageFile(file)) {
        throw new Error('Please upload a PNG, JPG, or SVG file under 5MB');
      }

      // Optimize image for academic branding
      const optimizedImage = await optimizeAcademicLogo(file);
      
      // Upload to CDN
      const logoUrl = await uploadToAcademicCDN(optimizedImage, journal.id);
      
      setBrandSettings(prev => ({
        ...prev,
        logo: {
          url: logoUrl,
          filename: file.name,
          size: file.size
        }
      }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Preview Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Journal Brand Settings</h2>
          <p className="text-academic-gray-600">
            Customize your journal's visual identity while maintaining platform consistency
          </p>
        </div>
        <Button
          variant={previewMode ? 'default' : 'outline'}
          onClick={() => setPreviewMode(!previewMode)}
        >
          <Eye className="w-4 h-4 mr-2" />
          {previewMode ? 'Edit Mode' : 'Preview Mode'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Journal Logo</CardTitle>
              <CardDescription>
                Upload your journal's logo. Recommended size: 200x50px or SVG format.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {brandSettings.logo && (
                  <div className="flex items-center gap-4 p-4 border border-academic-gray-200 rounded-md">
                    <img 
                      src={brandSettings.logo.url} 
                      alt="Journal logo"
                      className="h-12 w-auto"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{brandSettings.logo.filename}</p>
                      <p className="text-xs text-academic-gray-500">
                        {formatFileSize(brandSettings.logo.size)}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setBrandSettings(prev => ({ ...prev, logo: null }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                <FileUpload
                  onFileSelect={handleLogoUpload}
                  accept="image/png,image/jpeg,image/svg+xml"
                  maxSize={5 * 1024 * 1024} // 5MB
                  disabled={isUploading}
                >
                  <div className="border-2 border-dashed border-academic-gray-300 rounded-lg p-6 text-center">
                    {isUploading ? (
                      <div className="space-y-2">
                        <Loader className="w-8 h-8 animate-spin mx-auto" />
                        <p className="text-sm">Uploading and optimizing logo...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-academic-gray-400" />
                        <p className="text-sm font-medium">Upload Journal Logo</p>
                        <p className="text-xs text-academic-gray-500">
                          PNG, JPG, or SVG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </FileUpload>
              </div>
            </CardContent>
          </Card>

          {/* Color Palette */}
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Choose colors that represent your journal's identity. Colors are automatically adjusted for accessibility compliance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Color</label>
                  <ColorPicker
                    color={brandSettings.colors.primary}
                    onChange={(color) => handleColorChange('primary', color)}
                  />
                  <p className="text-xs text-academic-gray-500 mt-1">
                    Used for buttons, links, and highlights
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Secondary Color</label>
                  <ColorPicker
                    color={brandSettings.colors.secondary}
                    onChange={(color) => handleColorChange('secondary', color)}
                  />
                  <p className="text-xs text-academic-gray-500 mt-1">
                    Used for secondary elements and text
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Accent Color</label>
                  <ColorPicker
                    color={brandSettings.colors.accent}
                    onChange={(color) => handleColorChange('accent', color)}
                  />
                  <p className="text-xs text-academic-gray-500 mt-1">
                    Used for badges and special highlights
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Background</label>
                  <ColorPicker
                    color={brandSettings.colors.background}
                    onChange={(color) => handleColorChange('background', color)}
                  />
                  <p className="text-xs text-academic-gray-500 mt-1">
                    Main background color for content areas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Select fonts that reflect your journal's academic style
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Font (Interface)</label>
                  <Select
                    value={brandSettings.typography.primary}
                    onValueChange={(font) => setBrandSettings(prev => ({
                      ...prev,
                      typography: { ...prev.typography, primary: font }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter (Recommended)</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Heading Font</label>
                  <Select
                    value={brandSettings.typography.headings}
                    onValueChange={(font) => setBrandSettings(prev => ({
                      ...prev,
                      typography: { ...prev.typography, headings: font }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Merriweather">Merriweather</SelectItem>
                      <SelectItem value="Crimson Text">Crimson Text</SelectItem>
                      <SelectItem value="Source Serif Pro">Source Serif Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Manuscript Font</label>
                  <Select
                    value={brandSettings.typography.manuscript}
                    onValueChange={(font) => setBrandSettings(prev => ({
                      ...prev,
                      typography: { ...prev.typography, manuscript: font }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Crimson Text">Crimson Text (Recommended)</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Source Serif Pro">Source Serif Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Domain */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>
                Configure a custom domain for your journal (requires DNS configuration)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Domain</label>
                  <Input
                    type="text"
                    placeholder="journal.university.edu"
                    value={brandSettings.customDomain || ''}
                    onChange={(e) => setBrandSettings(prev => ({
                      ...prev,
                      customDomain: e.target.value
                    }))}
                  />
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>DNS Configuration Required:</strong> Point your domain's CNAME record to journals.synfind.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See how your branding changes will look to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-academic-gray-200 rounded-lg overflow-hidden">
                <BrandPreview settings={brandSettings} journal={journal} />
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Check */}
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Compliance</CardTitle>
              <CardDescription>
                Automatic accessibility validation for your branding choices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccessibilityValidation colors={brandSettings.colors} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-academic-gray-200">
        <div className="text-sm text-academic-gray-600">
          Changes will be applied immediately to your journal interface
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reset Changes
          </Button>
          <Button onClick={() => onSave(brandSettings)}>
            <Save className="w-4 h-4 mr-2" />
            Save Brand Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

// Brand preview component
const BrandPreview = ({ settings, journal }) => {
  const previewTheme = processJournalTheme({
    id: `${journal.id}-preview`,
    name: journal.name,
    colors: settings.colors,
    typography: settings.typography,
    icons: { logo: settings.logo },
    metadata: { title: journal.name }
  });

  return (
    <div 
      className="academic-brand-preview"
      style={{
        '--journal-primary': previewTheme.cssVariables['--journal-primary'],
        '--journal-secondary': previewTheme.cssVariables['--journal-secondary'],
        '--journal-accent': previewTheme.cssVariables['--journal-accent'],
        '--journal-background': previewTheme.cssVariables['--journal-background'],
        '--journal-text-primary': previewTheme.cssVariables['--journal-text-primary'],
        '--journal-text-secondary': previewTheme.cssVariables['--journal-text-secondary'],
        '--journal-font-primary': previewTheme.cssVariables['--journal-font-primary'],
        '--journal-font-headings': previewTheme.cssVariables['--journal-font-headings']
      }}
    >
      {/* Preview Header */}
      <div 
        className="p-4 flex items-center justify-between"
        style={{ 
          background: 'var(--journal-primary)',
          color: 'var(--journal-text-on-primary)',
          fontFamily: 'var(--journal-font-primary)'
        }}
      >
        <div className="flex items-center gap-3">
          {settings.logo ? (
            <img 
              src={settings.logo.url} 
              alt={journal.name}
              className="h-8 w-auto"
            />
          ) : (
            <div 
              className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--journal-accent)' }}
            >
              {journal.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 
              className="font-semibold text-sm"
              style={{ fontFamily: 'var(--journal-font-headings)' }}
            >
              {journal.name}
            </h3>
          </div>
        </div>
        <div className="text-xs opacity-80">Preview Mode</div>
      </div>

      {/* Preview Content */}
      <div 
        className="p-4 space-y-4"
        style={{ 
          background: 'var(--journal-background)',
          fontFamily: 'var(--journal-font-primary)'
        }}
      >
        <div 
          className="border rounded-md p-3"
          style={{ borderColor: 'var(--journal-border)' }}
        >
          <h4 
            className="font-semibold mb-2"
            style={{ 
              color: 'var(--journal-text-primary)',
              fontFamily: 'var(--journal-font-headings)'
            }}
          >
            Sample Manuscript Card
          </h4>
          <p 
            className="text-sm mb-3"
            style={{ color: 'var(--journal-text-secondary)' }}
          >
            "Machine Learning Applications in Academic Research" by Dr. Sarah Chen
          </p>
          <div className="flex gap-2">
            <button 
              className="px-3 py-1 text-xs rounded-md"
              style={{ 
                background: 'var(--journal-primary)',
                color: 'var(--journal-text-on-primary)'
              }}
            >
              View Manuscript
            </button>
            <button 
              className="px-3 py-1 text-xs rounded-md border"
              style={{ 
                borderColor: 'var(--journal-primary)',
                color: 'var(--journal-primary)'
              }}
            >
              Assign Reviewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Performance Optimization

### Theme Caching Strategy

```javascript
// Academic theme caching for global performance
class AcademicThemeCache {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
  }

  async getJournalTheme(journalId) {
    // Check cache first
    if (this.cache.has(journalId)) {
      const cached = this.cache.get(journalId);
      
      // Return cached theme if still valid
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour TTL
        return cached.theme;
      }
    }

    // Check if already loading
    if (this.loadingPromises.has(journalId)) {
      return this.loadingPromises.get(journalId);
    }

    // Load theme with caching
    const loadPromise = this.loadAndCacheTheme(journalId);
    this.loadingPromises.set(journalId, loadPromise);

    try {
      const theme = await loadPromise;
      return theme;
    } finally {
      this.loadingPromises.delete(journalId);
    }
  }

  async loadAndCacheTheme(journalId) {
    try {
      // Fetch theme from API
      const response = await fetch(`/api/journals/${journalId}/theme`, {
        cache: 'force-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load theme: ${response.status}`);
      }

      const rawTheme = await response.json();
      const processedTheme = processJournalTheme(rawTheme);

      // Cache the processed theme
      this.cache.set(journalId, {
        theme: processedTheme,
        timestamp: Date.now()
      });

      // Preload theme assets
      this.preloadThemeAssets(processedTheme);

      return processedTheme;
    } catch (error) {
      console.error(`Failed to load theme for journal ${journalId}:`, error);
      
      // Return default academic theme on error
      return getDefaultAcademicTheme();
    }
  }

  preloadThemeAssets(theme) {
    // Preload custom fonts
    if (theme.typography) {
      Object.values(theme.typography).forEach(font => {
        if (font !== 'system-ui' && font !== 'serif' && font !== 'sans-serif') {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
          link.as = 'style';
          document.head.appendChild(link);
        }
      });
    }

    // Preload logo and icons
    if (theme.icons?.logo) {
      const img = new Image();
      img.src = theme.icons.logo.url;
    }

    if (theme.icons?.favicon) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = theme.icons.favicon;
      link.as = 'image';
      document.head.appendChild(link);
    }
  }

  invalidateTheme(journalId) {
    this.cache.delete(journalId);
    this.loadingPromises.delete(journalId);
  }

  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// Global theme cache instance
const academicThemeCache = new AcademicThemeCache();
```

This comprehensive multi-tenant branding system enables each journal to maintain its unique academic identity while ensuring consistent usability, accessibility compliance, and optimal performance across the global Synfind platform.