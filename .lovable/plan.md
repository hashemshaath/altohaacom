
## SEO Optimization Sprint — 4 Areas

### 1. Image SEO Audit
- Scan all `<img>` tags for missing `alt`, `width`, `height`, `loading` attributes
- Verify hero images use `fetchPriority="high"` and `loading="eager"`
- Check all other images use `loading="lazy"`
- Ensure WebP format usage where possible
- Create a reusable `OptimizedImage` component if missing

### 2. Internal Linking Strategy
- Audit for orphan pages (pages with no internal links pointing to them)
- Check that `RelatedPages` component is used on all major content pages
- Add contextual cross-links between related sections (competitions↔exhibitions, recipes↔masterclasses)
- Verify breadcrumb coverage on all public pages

### 3. Mobile SEO Audit
- Verify `viewport` meta tag configuration
- Check tap target sizes (minimum 48x48px)
- Audit font sizes for readability (minimum 16px base)
- Verify mobile-specific schema (MobileApplication)
- Check for horizontal scroll issues

### 4. Content Gap Analysis
- Analyze existing page titles/descriptions for keyword opportunities
- Identify thin content pages (low word count)
- Check for duplicate/similar meta descriptions
- Generate recommendations for missing topic coverage
