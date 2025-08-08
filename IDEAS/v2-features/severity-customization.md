# Severity Customization (v2 Feature)

> **Status**: Candidate for v2.0  
> **Current v1**: Uses sensible defaults

## Overview

In v2, issue severity levels can be customized. This is NOT available in v1.

## Proposed Configuration

```yaml
# v2 ONLY - Not available in v1
severity:
  typeError: error         # TypeScript type errors
  formatIssue: warning     # Formatting issues
  lintIssue: warning      # Linting issues
  importOrder: info       # Import organization
  complexity: warning     # Complexity warnings
  syntaxError: error      # Syntax errors
  deprecated: warning     # Deprecated usage
  accessibility: warning  # A11y issues
  security: error        # Security issues
  performance: info      # Performance hints
```

## v1 Behavior (Current)

In v1, severity is automatically determined:
- **Error**: Type errors, syntax errors, security issues
- **Warning**: Lint issues, complexity, deprecated usage
- **Info**: Format issues, import order, suggestions

## Benefits of Deferring to v2

- Sensible defaults work for most projects
- Reduces configuration complexity
- Prevents misconfiguration
- Consistent severity across projects

## Use Cases for v2

1. **Strict Projects**: Treat all issues as errors
2. **Legacy Code**: Downgrade certain warnings
3. **CI/CD**: Different severity for different stages
4. **Team Preferences**: Customize based on team standards
5. **Progressive Enhancement**: Gradually increase strictness

## Severity Profiles (v2)

```yaml
# Strict mode
severityProfile: strict   # All issues are errors

# Relaxed mode
severityProfile: relaxed  # Most issues are warnings

# Custom mode
severity:
  typeError: error
  formatIssue: ignore    # Don't report
```

## Impact on Behavior

- **Error**: Blocks operations (if configured)
- **Warning**: Reports but continues
- **Info**: Informational only
- **Ignore**: Not reported

## Implementation Notes

- Provide clear defaults
- Support severity profiles
- Document impact of changes
- Consider tool-specific severity mapping