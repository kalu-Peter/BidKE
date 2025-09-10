# BidLode Brand Colors

This document outlines the official BidLode brand color scheme implemented across the application.

## Official Brand Colors

### Primary Blue - #084597
- **Usage**: Main brand color, primary buttons, headers, navigation
- **CSS Variable**: `--primary: 216 94% 30%`
- **Tailwind Classes**: `bg-primary`, `text-primary`, `border-primary`

### Secondary Blue - #205DAD  
- **Usage**: Secondary elements, buyer badges, complementary accents
- **CSS Variable**: `--secondary: 218 55% 54%`
- **Tailwind Classes**: `bg-secondary`, `text-secondary`, `border-secondary`

### Coral Red - #FF7272
- **Usage**: Accent color, call-to-action elements, highlights, admin badges
- **CSS Variable**: `--accent: 0 82% 72%`
- **Tailwind Classes**: `bg-accent`, `text-accent`, `border-accent`

## Gradient Combinations

### Primary Gradient
- **CSS Variable**: `--gradient-primary: linear-gradient(135deg, hsl(216 94% 30%), hsl(218 55% 54%))`
- **Usage**: Hero sections, primary buttons with `variant="hero"`
- **Tailwind Class**: `bg-gradient-primary`

### Accent Gradient
- **CSS Variable**: `--gradient-accent: linear-gradient(135deg, hsl(0 82% 72%), hsl(0 70% 65%))`
- **Usage**: Special highlights, call-to-action elements
- **Tailwind Class**: `bg-gradient-accent`

### Hero Gradient
- **CSS Variable**: `--gradient-hero: linear-gradient(135deg, hsl(216 94% 30%) 0%, hsl(218 55% 54%) 50%, hsl(0 82% 72%) 100%)`
- **Usage**: Main hero sections, landing page backgrounds
- **Tailwind Class**: `bg-gradient-hero`

## Usage Guidelines

### Component Color Mapping
- **Sellers**: Use `primary` colors (dark blue)
- **Buyers**: Use `secondary` colors (medium blue)  
- **Admins**: Use `accent` colors (coral red)
- **Call-to-Actions**: Use `gradient-primary` or `accent`
- **Status Indicators**: Use appropriate brand color with opacity variants

### Implementation Examples

```tsx
// Primary button
<Button variant="hero">Get Started</Button>

// Seller badge
<Badge className="bg-primary/10 text-primary">Seller</Badge>

// Buyer badge  
<Badge className="bg-secondary/10 text-secondary">Buyer</Badge>

// Admin badge
<Badge className="bg-accent/10 text-accent">Admin</Badge>

// Hero section
<section className="bg-gradient-hero">...</section>
```

## Files Updated
- `src/index.css` - CSS variables and design tokens
- `tailwind.config.ts` - Tailwind color configuration
- `src/components/Header.tsx` - Logo and navigation
- `src/components/Footer.tsx` - Logo and branding
- `src/components/dashboard/DashboardLayout.tsx` - Dashboard header and role badges
- `index.html` - Favicon and meta tags

## Brand Consistency
All components should use the defined CSS variables and Tailwind classes rather than hardcoded hex values to ensure brand consistency across the application.
