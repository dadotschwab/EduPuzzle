# Specification: Modern Landing Page Design

## 0. Original User Request

> please implement the plan above, ignore the entire "responsive design" section

## 1. Goal & Context

Transform the existing EduPuzzle landing page with a modern, playful, and energetic design inspired by the VocabCross reference. The goal is to create a visually striking landing page that appeals to students (age 12-25) while maintaining the EduPuzzle brand identity and integrating with existing features like crossword puzzle generation, spaced repetition learning, and collaborative word lists.

**Key Requirements:**

- Implement modern visual design with vibrant gradients and playful animations
- Create interactive demo section showcasing AI-powered puzzle generation
- Maintain EduPuzzle branding and feature integration
- Use existing component library (shadcn/ui) and design patterns
- Focus on desktop-first implementation (responsive design ignored per request)

**User Flow:**

1. User lands on homepage and sees energetic hero section with animated puzzle visual
2. User explores interactive demo to experience AI clue generation
3. User learns about features through visually engaging cards
4. User understands the simple 3-step process
5. User converts through compelling CTA sections

## 2. Requirements

### Functional:

- [ ] Implement sticky header navigation with smooth scroll
- [ ] Create hero section with animated crossword puzzle visual
- [ ] Build interactive AI demo for clue generation
- [ ] Design features grid with hover effects and animations
- [ ] Create "How It Works" 3-step process section
- [ ] Build compelling CTA sections with gradient backgrounds
- [ ] Implement footer with proper navigation and social links
- [ ] Add micro-interactions and animations throughout

### Non-Functional:

- [ ] Maintain consistent design system with existing EduPuzzle components
- [ ] Ensure smooth animations and transitions
- [ ] Optimize for performance with efficient rendering
- [ ] Follow existing TypeScript patterns and type safety
- [ ] Integrate with existing authentication and user state

## 3. Architecture & Research

### Codebase Impact

**Files to Modify:**

- `src/pages/LandingPage.tsx` (entire file)
  - Current state: Basic centered title and subtitle with minimal styling
  - Required change: Complete rewrite to implement modern landing page with hero, features, demo, and CTA sections

- `src/components/ui/button.tsx` (extend variants)
  - Current state: Standard button variants (default, destructive, outline, secondary, ghost, link)
  - Required change: Add gradient button variants for CTAs and hero buttons

- `src/components/ui/card.tsx` (extend with hover effects)
  - Current state: Basic card component with header/content/footer
  - Required change: Add hover animation variants for feature cards

**Files to Create:**

- `src/components/landing/HeroSection.tsx`
  - Purpose: Animated hero section with crossword puzzle visual and main CTA
  - Pattern: Follow existing component structure with TypeScript interfaces and React.memo

- `src/components/landing/InteractiveDemo.tsx`
  - Purpose: AI-powered clue generation demo section
  - Pattern: Integrate with existing usePuzzleGeneration hook and puzzle components

- `src/components/landing/FeaturesGrid.tsx`
  - Purpose: Feature showcase with hover animations and icons
  - Pattern: Use existing Card components with Lucide React icons

- `src/components/landing/HowItWorks.tsx`
  - Purpose: 3-step process visualization
  - Pattern: Follow existing component patterns with proper TypeScript types

- `src/components/landing/StickyHeader.tsx`
  - Purpose: Navigation header with smooth scroll links
  - Pattern: Extend AppLayout.tsx pattern but adapted for landing page

- `src/components/landing/Footer.tsx`
  - Purpose: Footer with navigation and social links
  - Pattern: Follow existing layout component structure

- `src/components/landing/AnimatedPuzzle.tsx`
  - Purpose: Animated crossword puzzle visual for hero section
  - Pattern: Extract and adapt logic from existing PuzzleGrid.tsx

- `src/hooks/useScrollSpy.ts`
  - Purpose: Track scroll position for sticky header highlighting
  - Pattern: Follow existing custom hook patterns (useAuth, usePuzzleGeneration)

- `src/hooks/useIntersectionObserver.ts`
  - Purpose: Trigger animations when sections come into view
  - Pattern: Custom hook for performance-optimized scroll animations

**Existing Patterns Identified:**

- **Component Structure:** Feature-based folders under `src/components/` with index files for clean imports
- **Styling:** Tailwind CSS with shadcn/ui design system, CSS variables for theming, consistent spacing (p-6, space-y-\*, etc.)
- **Animations:** tailwindcss-animate plugin with custom keyframes, React transitions for state changes
- **TypeScript:** Strict typing with interfaces for props, proper JSDoc comments
- **Performance:** React.memo for expensive components, useCallback/useMemo for optimization
- **State Management:** React Query for server state, Zustand for global state, local state for component-specific data
- **Integration:** useAuth for authentication, React Router for navigation, Supabase for backend

**Dependencies Status:**

- ✅ @radix-ui/react-\* components: Already installed (alert-dialog, dialog, popover, slot)
- ✅ lucide-react: ^0.323.0 (for icons in feature cards and navigation)
- ✅ tailwindcss-animate: ^1.0.7 (for smooth animations and transitions)
- ✅ @tanstack/react-query: ^5.20.0 (for demo puzzle generation)
- ✅ zustand: ^4.5.0 (if global state needed for demo)
- ⚠️ framer-motion: Not installed (consider for complex animations if needed)
- ✅ class-variance-authority: ^0.7.0 (for extended button/card variants)

## 4. Tech Stack Specifications

### Supabase (Backend)

[TODO: @supabase-specialist - SQL Schema, RLS Policies, Database Functions, Realtime subscriptions]

### Stripe (Payments)

[TODO: @stripe-specialist - API Routes, Webhook handlers, Customer Portal, Security patterns]

### React + Shadcn/UI (Frontend)

**Component Architecture:**

```
src/components/landing/
├── LandingPage.tsx          # Main orchestrator
├── HeroSection.tsx          # Animated hero with puzzle visual
├── InteractiveDemo.tsx      # AI clue generation demo
├── FeaturesGrid.tsx         # Feature cards with hover effects
├── HowItWorks.tsx           # 3-step process visualization
├── StickyHeader.tsx         # Navigation with scroll spy
├── Footer.tsx               # Footer navigation
└── AnimatedPuzzle.tsx       # Puzzle animation component
```

**Component Specifications:**

---

**1. LandingPage.tsx**

Purpose: Main landing page orchestrator that manages scroll state and renders all sections

Props:

```typescript
interface LandingPageProps {
  className?: string
}
```

State Management:

- Uses `useScrollSpy` hook for active navigation highlighting
- Uses `useIntersectionObserver` for section animations
- Local state for demo interactions

Key Logic:

- Renders sections in order: Hero, Demo, Features, HowItWorks, Footer
- Passes scroll handlers to StickyHeader
- Manages global loading states for demo

Layout:

```tsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
  <StickyHeader activeSection={activeSection} onNavigate={handleNavigate} />
  <main>
    <HeroSection onCtaClick={handleCtaClick} />
    <InteractiveDemo />
    <FeaturesGrid />
    <HowItWorks />
  </main>
  <Footer />
</div>
```

---

**2. HeroSection.tsx**

Purpose: Animated hero section with crossword puzzle visual and main call-to-action

Props:

```typescript
interface HeroSectionProps {
  onCtaClick: () => void
}
```

Animation:

- Entrance animations using `tailwindcss-animate`
- Puzzle morphing with custom keyframes
- Staggered text reveals

Layout:

```tsx
<section className="relative min-h-screen flex items-center justify-center overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
  <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
    <AnimatedPuzzle className="mb-8" />
    <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-fade-in">
      Master Vocabulary with AI-Powered Puzzles
    </h1>
    <p className="text-xl text-gray-600 mt-6 animate-slide-up">
      Transform learning into play with intelligent crossword puzzles
    </p>
    <div className="mt-8 space-x-4">
      <Button size="lg" className="gradient-cta" onClick={onCtaClick}>
        Start Learning Free
      </Button>
      <Button variant="outline" size="lg">
        Watch Demo
      </Button>
    </div>
  </div>
</section>
```

---

**3. InteractiveDemo.tsx**

Purpose: Live demo of AI clue generation showing puzzle creation process

Props:

```typescript
interface InteractiveDemoProps {
  className?: string
}
```

State Management:

- Uses `usePuzzleGeneration` hook for demo data
- Local state for user inputs and animation states
- Loading states during generation

Key Logic:

- Allows users to input words and see live puzzle generation
- Shows step-by-step process: input → processing → result
- Error handling for failed generations

Layout:

```tsx
<section className="py-20 bg-white">
  <div className="max-w-6xl mx-auto px-4">
    <h2 className="text-4xl font-bold text-center mb-12">See AI in Action</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <Input
          placeholder="Enter vocabulary words..."
          value={inputWords}
          onChange={(e) => setInputWords(e.target.value)}
        />
        <Button onClick={generateDemo} disabled={loading} className="w-full">
          {loading ? 'Generating...' : 'Create Puzzle'}
        </Button>
        {error && <p className="text-red-500">{error}</p>}
      </div>
      <div className="relative">
        {loading && <Skeleton className="h-96 w-full" />}
        {puzzle && <AnimatedPuzzle puzzle={puzzle} animate={true} />}
      </div>
    </div>
  </div>
</section>
```

---

**4. FeaturesGrid.tsx**

Purpose: Showcase key features with animated cards and hover effects

Props:

```typescript
interface FeaturesGridProps {
  className?: string
}
```

Animation:

- Hover effects with scale transforms
- Staggered entrance animations
- Icon animations on hover

Layout:

```tsx
<section className="py-20 bg-gray-50">
  <div className="max-w-6xl mx-auto px-4">
    <h2 className="text-4xl font-bold text-center mb-12">Why Choose EduPuzzle?</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <Card
          key={feature.title}
          className="hover-card group cursor-pointer"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader>
            <feature.icon className="h-12 w-12 text-blue-600 group-hover:scale-110 transition-transform" />
            <CardTitle>{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{feature.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</section>
```

---

**5. HowItWorks.tsx**

Purpose: 3-step process visualization with connecting lines and animations

Props:

```typescript
interface HowItWorksProps {
  className?: string
}
```

Animation:

- Step-by-step reveals
- Connecting line animations
- Icon transitions

Layout:

```tsx
<section className="py-20 bg-white">
  <div className="max-w-4xl mx-auto px-4 text-center">
    <h2 className="text-4xl font-bold mb-12">How It Works</h2>
    <div className="relative">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {steps.map((step, index) => (
          <div key={step.title} className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
              {index + 1}
            </div>
            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
            <p className="text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
```

---

**6. StickyHeader.tsx**

Purpose: Navigation header with smooth scroll and active section highlighting

Props:

```typescript
interface StickyHeaderProps {
  activeSection: string
  onNavigate: (sectionId: string) => void
}
```

State Management:

- Uses `useScrollSpy` for active section tracking
- Local state for mobile menu toggle

Key Logic:

- Smooth scroll to sections
- Mobile responsive hamburger menu
- Active link highlighting

Layout:

```tsx
<header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b z-50">
  <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
    <div className="flex items-center space-x-8">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        EduPuzzle
      </h1>
      <div className="hidden md:flex space-x-6">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'text-sm font-medium transition-colors hover:text-blue-600',
              activeSection === item.id && 'text-blue-600'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
    <div className="flex items-center space-x-4">
      <Button variant="ghost">Login</Button>
      <Button className="gradient-cta">Sign Up</Button>
    </div>
  </nav>
</header>
```

---

**Custom Hook: `useScrollSpy.ts`**

Purpose: Track scroll position and highlight active navigation sections

Pattern: Custom hook following existing patterns (useAuth, usePuzzleGeneration)

```typescript
import { useState, useEffect } from 'react'

interface UseScrollSpyOptions {
  sectionIds: string[]
  offset?: number
}

export function useScrollSpy({ sectionIds, offset = 100 }: UseScrollSpyOptions) {
  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset

      for (const sectionId of sectionIds) {
        const element = document.getElementById(sectionId)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [sectionIds, offset])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return { activeSection, scrollToSection }
}
```

**Hook Dependencies:**

- React built-in hooks only
- No external dependencies for performance

---

**Custom Hook: `useIntersectionObserver.ts`**

Purpose: Trigger animations when sections come into view

Pattern: Performance-optimized scroll animations

```typescript
import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useIntersectionObserver(options: UseIntersectionObserverOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const ref = useRef<HTMLElement>(null)

  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting
        setIsIntersecting(isVisible)

        if (isVisible && triggerOnce && !hasTriggered) {
          setHasTriggered(true)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce, hasTriggered])

  return { ref, isIntersecting, hasTriggered }
}
```

**Hook Dependencies:**

- Intersection Observer API (widely supported)
- React hooks for state management

---

**State Management Strategy:**

Based on codebase patterns (Section 3.1):

- **Server state:** React Query for puzzle generation (`usePuzzleGeneration`)
- **Local state:** Component-specific UI state (loading, errors, form inputs)
- **Global state:** None needed (landing page is stateless)

For this landing page:

- ✅ Use `usePuzzleGeneration` for demo functionality
- ✅ Local state for user interactions and animations
- ❌ No Zustand store (data is temporary and user-specific)

---

**Shadcn/UI Extensions:**

**Install Required Components:**

```bash
npx shadcn-ui@latest add button card badge dialog skeleton input
```

**Extended Button Variants (src/components/ui/button.tsx):**

```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // ... existing variants
        gradient:
          'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
        // ... other variants
      },
      // ... existing sizes
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

**Extended Card Variants (src/components/ui/card.tsx):**

```typescript
const cardVariants = cva('rounded-lg border bg-card text-card-foreground shadow-sm', {
  variants: {
    hover: {
      default: '',
      lift: 'hover:shadow-lg hover:-translate-y-1 transition-all duration-300',
      glow: 'hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300',
    },
  },
  defaultVariants: {
    hover: 'default',
  },
})
```

**Component Usage:**

1. **Button** (CTAs and interactions)
   - Variants: `default`, `outline`, `gradient` (extended)
   - Sizes: `default`, `sm`, `lg`
   - States: `disabled`, `loading`

2. **Card** (feature showcase)
   - Variants: `default`, `hover-lift`, `hover-glow` (extended)
   - Sub-components: `CardHeader`, `CardContent`, `CardFooter`

3. **Input** (demo word input)
   - Types: `text`, `email`
   - States: `disabled`, `error`

4. **Skeleton** (loading states)
   - Custom heights: `h-96`, `h-12`
   - Responsive: `w-full`

5. **Dialog** (modal interactions)
   - Components: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTrigger`

**Layout Patterns (Tailwind + Shadcn):**

```tsx
// Gradient backgrounds
<div className="bg-gradient-to-r from-blue-50 via-white to-purple-50">

// Animated entrance
<div className="animate-fade-in" style={{ animationDelay: '200ms' }}>

// Hover effects
<Card className="hover:shadow-xl hover:scale-105 transition-all duration-300">

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

// Sticky navigation
<header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b z-50">
```

**Animation Implementation:**

**CSS Animations (tailwind.config.js):**

```javascript
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.8s ease-out',
        'bounce-in': 'bounceIn 1s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
}
```

**Scroll-triggered Animations:**

```tsx
function AnimatedSection({ children }) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.2,
    triggerOnce: true,
  })

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-1000',
        isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
    >
      {children}
    </div>
  )
}
```

**Performance Optimizations:**

- ✅ React.memo for expensive components (AnimatedPuzzle, FeaturesGrid)
- ✅ useCallback for event handlers (onNavigate, onCtaClick)
- ✅ useMemo for computed values (filtered features)
- ✅ Lazy loading for heavy components
- ✅ Intersection Observer for scroll animations (not scroll listeners)

**TypeScript Types:**

```typescript
// Component props
interface HeroSectionProps {
  onCtaClick: () => void
}

interface Feature {
  title: string
  description: string
  icon: LucideIcon
}

interface Step {
  title: string
  description: string
}

// Hook return types
interface UseScrollSpyReturn {
  activeSection: string
  scrollToSection: (sectionId: string) => void
}

interface UseIntersectionObserverReturn {
  ref: React.RefObject<HTMLElement>
  isIntersecting: boolean
  hasTriggered: boolean
}

// Demo state
interface DemoState {
  inputWords: string
  loading: boolean
  error: string | null
  generatedPuzzle: PuzzleData | null
}
```

**Integration with Existing Hooks:**

- `useAuth`: Check authentication status for CTA buttons
- `usePuzzleGeneration`: Power the interactive demo
- Follow existing patterns: error handling, loading states, TypeScript interfaces

**Accessibility Considerations:**

- ✅ Semantic HTML: `header`, `nav`, `main`, `section`
- ✅ Focus management: Tab navigation through interactive elements
- ✅ ARIA labels: Screen reader support for icons and buttons
- ✅ Keyboard navigation: Enter/Space for button actions
- ✅ Reduced motion: Respects `prefers-reduced-motion`
- ✅ Color contrast: WCAG compliant gradients and text

**Testing Considerations:**

Unit tests (Vitest):

- Test `useScrollSpy` active section detection
- Test `useIntersectionObserver` trigger logic
- Test component prop handling

Component tests (React Testing Library):

- Test hero CTA button clicks
- Test demo input and generation flow
- Test navigation scroll behavior
- Test responsive layouts

E2E tests (Playwright):

- Test full user journey: scroll → demo → CTA
- Test mobile navigation menu
- Test animation performance

**Best Practices from Research:**

- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
  - Key insight: Extract reusable logic, follow Rules of Hooks
  - Applied: `useScrollSpy`, `useIntersectionObserver` for scroll interactions

- [Shadcn Composition](https://ui.shadcn.com/docs/components/card#composition)
  - Key insight: Use sub-components for flexibility
  - Applied: `CardHeader`, `CardContent` for feature cards

- [React Performance](https://react.dev/learn/render-and-commit)
  - Key insight: Memoize expensive computations
  - Applied: React.memo, useCallback, useMemo throughout

**Common Pitfalls to Avoid:**

- ❌ Hardcoding section IDs in components (use constants)
- ❌ Not cleaning up event listeners (memory leaks)
- ❌ Blocking animations on low-end devices (use `prefers-reduced-motion`)
- ❌ Not handling loading states (poor UX)
- ❌ Missing error boundaries (crashes on demo failures)
- ❌ Not testing mobile layouts (responsive issues)

## 5. Implementation Plan

### Phase 1: Foundation Setup

- [ ] Install required shadcn/ui components: `button`, `card`, `badge`, `dialog`, `skeleton`, `input`
- [ ] Extend button variants with gradient styles in `src/components/ui/button.tsx`
- [ ] Extend card variants with hover effects in `src/components/ui/card.tsx`
- [ ] Add custom animations to `tailwind.config.js` (fade-in, slide-up, bounce-in)
- [ ] Create landing components directory structure: `src/components/landing/`

**Git Commit:** `feat(landing): setup foundation components and styling`

---

### Phase 2: Custom Hooks Implementation

- [ ] Create `src/hooks/useScrollSpy.ts` for navigation section tracking
- [ ] Create `src/hooks/useIntersectionObserver.ts` for scroll-triggered animations
- [ ] Add unit tests for both hooks using Vitest
- [ ] Test scroll behavior and intersection detection

**Git Commit:** `feat(landing): implement scroll tracking and animation hooks`

---

### Phase 3: Core Landing Components

- [ ] Create `src/components/landing/LandingPage.tsx` - main orchestrator component
- [ ] Create `src/components/landing/StickyHeader.tsx` - navigation with smooth scroll
- [ ] Create `src/components/landing/HeroSection.tsx` - animated hero with CTA
- [ ] Create `src/components/landing/Footer.tsx` - footer with navigation links
- [ ] Implement basic layout and navigation flow

**Git Commit:** `feat(landing): implement core layout and navigation components`

---

### Phase 4: Interactive Elements

- [ ] Create `src/components/landing/AnimatedPuzzle.tsx` - hero puzzle visual
- [ ] Create `src/components/landing/InteractiveDemo.tsx` - AI clue generation demo
- [ ] Integrate with existing `usePuzzleGeneration` hook
- [ ] Add loading states and error handling for demo functionality
- [ ] Test demo flow with actual puzzle generation

**Git Commit:** `feat(landing): add interactive demo and animated puzzle`

---

### Phase 5: Content Sections

- [ ] Create `src/components/landing/FeaturesGrid.tsx` - feature showcase cards
- [ ] Create `src/components/landing/HowItWorks.tsx` - 3-step process visualization
- [ ] Add hover animations and micro-interactions
- [ ] Implement staggered entrance animations
- [ ] Add content for EduPuzzle-specific features

**Git Commit:** `feat(landing): implement feature showcase and process sections`

---

### Phase 6: Integration & Polish

- [ ] Update `src/pages/LandingPage.tsx` with new implementation
- [ ] Integrate with existing authentication (`useAuth` hook)
- [ ] Add proper error boundaries around interactive demo
- [ ] Implement smooth scroll behavior between sections
- [ ] Add loading skeletons and proper error states

**Git Commit:** `feat(landing): integrate with existing auth and error handling`

---

### Phase 7: Performance & Accessibility

- [ ] Add React.memo to expensive components (AnimatedPuzzle, FeaturesGrid)
- [ ] Implement useCallback for event handlers
- [ ] Add proper ARIA labels and semantic HTML
- [ ] Test keyboard navigation and screen reader support
- [ ] Optimize animations for performance

**Git Commit:** `perf(landing): optimize performance and accessibility`

---

### Phase 8: Testing & Validation

**Automated Tests:**

- [ ] Unit test: `useScrollSpy` section detection logic
- [ ] Unit test: `useIntersectionObserver` trigger behavior
- [ ] Component test: HeroSection CTA button interactions
- [ ] Component test: InteractiveDemo input and generation flow
- [ ] Component test: StickyHeader navigation and scroll behavior

**Manual Validation:**

- [ ] Test smooth scroll navigation between sections
- [ ] Verify demo generates puzzles correctly with existing API
- [ ] Check animations trigger on scroll
- [ ] Validate hover effects and micro-interactions
- [ ] Test authentication integration (login/signup buttons)
- [ ] Verify error handling in demo section

**Git Commit:** `test(landing): add comprehensive tests and validate user flows`

---

### Phase 9: Content Finalization

- [ ] Update all placeholder text with EduPuzzle-specific content
- [ ] Add actual feature descriptions based on existing functionality
- [ ] Update navigation links to match actual section IDs
- [ ] Add social media links and footer navigation
- [ ] Finalize color scheme to match EduPuzzle branding

**Git Commit:** `content(landing): finalize EduPuzzle-specific content and branding`

---

### Manual Setup Required

No manual setup required - this is a pure frontend implementation that uses existing:

- Authentication system (Supabase Auth)
- Puzzle generation API (existing hooks)
- Component library (shadcn/ui)
- Styling system (Tailwind CSS)

The implementation will seamlessly integrate with the existing EduPuzzle architecture without requiring any backend changes, environment variables, or external service configuration.
