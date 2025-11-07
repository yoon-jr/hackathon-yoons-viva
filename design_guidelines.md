# Design Guidelines: ViVa 편의점 과자 리브랜딩 마케팅 플랫폼

## Design Approach: Toss-Inspired Minimal + Friendly Playfulness

**Primary Direction**: Toss's clean minimalism meets the approachable warmth of convenience store culture. Professional SaaS efficiency with a sprinkle of snack-world charm.

**Reference Inspirations**:
- Toss (clean cards, generous spacing, minimal shadows)
- Duolingo (friendly without being childish)
- Modern Korean fintech apps (smooth interactions, approachable professionalism)

---

## Core Design Elements

### A. Typography System

**Primary Font**: Pretendard (via CDN) - superior Korean readability, modern sans-serif
**Accent Font**: Gmarket Sans (sparingly for playful headlines only)

**Hierarchy**:
- Hero Headlines: Bold, 4xl-6xl, Gmarket Sans
- Section Headers: Bold, 2xl-3xl, Pretendard
- Card Titles: Semibold, xl-2xl, Pretendard
- Body Text: Regular, base-lg, Pretendard
- Metadata/Labels: Medium, sm-base, Pretendard

### B. Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16, 20, 24
- Component padding: 6, 8
- Section spacing: 16, 20, 24
- Major separations: 24, 32

**Container Strategy**:
- Full-width sections with inner max-w-6xl
- Forms/Chat: max-w-3xl centered
- Content blocks: max-w-prose for readability

---

## C. Component Library

### 1. Survey Form (Product Input)
**Layout**: Progress stepper → Multi-step form → Submit CTA

**Progress Indicator**: 
- Horizontal step dots, filled/unfilled states
- Current step highlighted with subtle pulse animation
- Step labels below dots (제품 정보 → 타겟 → 전략 선택)

**Form Fields**:
- Generous input fields with rounded-xl corners
- Minimal 1px borders, expand on focus
- Floating labels that animate upward
- Helper text in muted tone below fields
- Radio/checkbox cards with icon + text, full-click targets

**Field Types**:
- Product name (large text input)
- Target age group (icon cards in 2-column grid: 10대/20대/30대/40대+)
- Season/timing (dropdown with emoji indicators)
- Current status (pill buttons: 신제품/리뉴얼/기존제품)

### 2. Chat Interface (AI Strategy Agent)
**Layout**: Sticky header (100px) → Message stream → Fixed input bar (80px)

**Message Bubbles**:
- AI: Left-aligned, rounded-3xl, subtle fill, small avatar
- User: Right-aligned, rounded-3xl, minimal styling
- Generous vertical spacing (12) between messages
- Timestamp on hover only

**Input Bar**:
- Auto-expanding textarea (min-h-14, max-h-32)
- Send button inside input (absolute right)
- Suggestion chips above input area (horizontally scrollable)
- File attachment option with icon

### 3. Strategy Cards Grid
**Card Design**:
- Clean rounded-2xl cards with minimal 1px border
- Hover: Subtle lift (translate-y-1) + soft shadow
- Internal padding: 8
- Card anatomy: Emoji/icon top → Title → 2-line description → Arrow icon

**Grid Layout**:
- Mobile: 1 column
- Tablet: 2 columns (grid-cols-2 gap-6)
- Desktop: 3 columns (lg:grid-cols-3 gap-8)

**Strategy Categories** (visual differentiation via emoji):
- 콜라보 전략: 🤝
- 네이밍 전략: ✏️
- 시즌 캠페인: 🗓️
- SNS 바이럴: 📱

**Detail Modal**:
- Full-screen on mobile, centered large modal on desktop
- Generated image at top (16:9 aspect ratio)
- Scrollable content area: Title → Visual → Detailed steps → Implementation tips
- Action buttons: 다운로드 / 공유 / 새로 생성

### 4. Image Display System
**Generated Visuals**:
- Aspect ratio: 16:9 for horizontal, 4:5 for vertical mockups
- Rounded-xl corners
- Loading skeleton: Subtle shimmer animation
- Image container with 1px border
- Action buttons below: Download and Regenerate icons

### 5. Navigation
**Header** (h-16, sticky):
- Logo left (ViVa with snack icon)
- Center nav: 홈 / 전략 만들기 / 갤러리 / 가이드
- Right CTA: "시작하기" button (rounded-full, px-6)

**Footer** (py-16):
- 4-column grid on desktop, stacked on mobile
- Column 1: Logo + tagline
- Column 2: Product links
- Column 3: Resources
- Column 4: Contact + Social icons
- Bottom: Copyright + Legal links (single row)

---

## Visual Treatment

**Minimal Approach**:
- No thick borders (use 1px or none)
- Soft shadows only on hover/interaction (shadow-sm to shadow-md)
- Rounded corners throughout (rounded-xl standard, rounded-2xl for cards, rounded-full for pills)
- Ample whitespace (never cramped layouts)

**Micro-interactions**:
- Buttons: Scale(0.98) on active, smooth transitions (duration-200)
- Cards: Subtle lift on hover
- Inputs: Border expansion on focus
- Checkmarks: Check animation on selection
- Loading states: Gentle pulse or shimmer

**Friendly Elements**:
- Emoji integration (not excessive, strategic placement)
- Icon-first approach (Heroicons outline style)
- Welcoming empty states with illustration + helpful text
- Success confirmations with celebratory animation

---

## Page-Specific Layouts

### Landing Page
**Structure**: Hero (100vh) → Value Props (3-column) → How It Works (4-step) → Sample Results (grid) → Final CTA

**Hero Section**:
- Full viewport height with centered content
- Headline: "편의점 과자, 다시 바이럴 시키다" (Gmarket Sans, bold)
- Subheadline: "AI 기반 리브랜딩 마케팅 플랫폼 ViVa"
- Hero image: Wide collage of Korean convenience store snacks
- Primary CTA: "무료로 시작하기" (large, rounded-full, with blur background if on image)
- Trust indicator below: "이미 32개 브랜드가 사용중"

**Value Props** (py-24):
- 3-column card grid
- Each card: Icon → Title → Description
- Cards with subtle hover lift

**How It Works** (py-24):
- 4-step horizontal flow on desktop, vertical on mobile
- Numbered badges (①②③④) with connecting lines
- Each step: Badge → Title → Brief description
- Step illustrations/screenshots

**Sample Results** (py-24):
- Masonry grid of 6-8 sample strategy cards
- "모든 결과 보기" link at bottom

**Final CTA** (py-32):
- Centered, generous padding
- Large headline + subtext
- Dual CTAs: Primary + Secondary (outlined)

### Survey/Input Page
- Single-page stepper form, max-w-3xl centered
- Each step in its own card with py-12 padding
- Navigation: 이전 / 다음 buttons at bottom

### Strategy Generation Page
**Desktop**: 2-column split (40% chat / 60% preview panel)
**Mobile**: Tabs switching between Chat and Preview
- Preview panel shows generated strategies in real-time
- Strategies appear as they're created with fade-in animation

### Gallery/Results Page
- Filter bar at top (horizontal scrollable chips)
- Masonry grid of strategy cards
- Infinite scroll or pagination
- Quick preview on card click, full detail on "자세히" click

---

## Icons & Images

**Icons**: Heroicons (outline primary, solid for selected states)

**Images**:
- **Hero Image**: YES - Wide collage showcasing iconic Korean convenience store snacks (초코파이, 새우깡, 허니버터칩) with modern editorial styling
- **Strategy Visuals**: AI-generated DALL-E images for each marketing strategy
- **How It Works**: UI screenshots showing actual platform usage
- **Empty States**: Custom illustrations (friendly, minimal line-art style)
- **Avatar/Mascot**: Small friendly character for AI chat (simple, geometric)

---

**Accessibility**: Maintain 4.5:1 contrast ratios, keyboard navigation for all interactive elements, ARIA labels on icons, focus indicators on all inputs.