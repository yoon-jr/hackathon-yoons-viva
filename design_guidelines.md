# Design Guidelines: 역바이럴 (Reverse Viral) 마케팅 플랫폼

## Design Approach: Retro-Modern (뉴트로) B2B Platform

**Primary Direction**: Korean 80s-90s snack packaging aesthetics meets modern SaaS interface - nostalgic yet professional, playful yet business-focused.

**Reference Inspirations**:
- Retro Korean snack packaging (bold colors, playful typography, geometric patterns)
- Modern productivity tools (Linear's clean chat, Notion's card system)
- Successful newtro brands (Market Kurly's retro identity meets digital efficiency)

---

## Core Design Elements

### A. Typography System

**Primary Font**: Pretendard (via CDN) - excellent Korean readability with modern retro feel
**Accent Font**: Gmarket Sans (for playful CTAs and headings) - evokes Korean consumer nostalgia

**Hierarchy**:
- Hero Headlines: Bold, 3xl-5xl, Gmarket Sans
- Section Headers: Bold, 2xl-3xl, Pretendard
- Body Text: Regular, base-lg, Pretendard
- Chat Messages: Regular, base, Pretendard
- Labels/Metadata: Medium, sm, Pretendard

### B. Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16, 24
- Tight spacing (4): Form field gaps, card padding
- Medium spacing (8, 12): Section internal spacing
- Large spacing (16, 24): Major section separation

**Grid Strategy**:
- Survey form: Single column on mobile, 2-column on desktop (max-w-4xl)
- Strategy cards: 1 column mobile, 2 columns tablet, 3 columns desktop
- Chat interface: Single column (max-w-3xl) centered

### C. Component Library

#### 1. Survey Form (Initial Input)
**Layout**: Stepped progress indicator → Form fields → Submit CTA
- Retro-styled progress dots (filled circles with playful colors)
- Input fields with thick borders (3px), rounded corners (rounded-lg)
- Dropdown selectors styled like old vending machine buttons
- Large, colorful submit button with slight shadow (retro depth effect)

**Fields**:
- Product name input (text)
- Age group selector (radio cards with age-specific icons: 10대/20대/30대)
- Marketing period (dropdown: 수능시즌/여름/연말 etc.)
- Current status (pill buttons: 성공/실패/비바이럴)

#### 2. Chat Interface (AI Agent)
**Layout**: Fixed header → Scrollable message area → Input bar (sticky bottom)

**Message Bubbles**:
- AI messages: Left-aligned, rounded-2xl, with retro pattern background
- User messages: Right-aligned, rounded-2xl, solid fill
- Each AI message includes small avatar icon (playful mascot)

**Input Bar**:
- Large text area (min-h-24) with thick border
- Send button as retro "실행" style with icon
- Quick suggestion pills below input (pre-set prompts)

#### 3. Strategy Cards System
**Card Design**:
- Bordered cards (border-3) with slight tilt effect on hover
- Each card shows: Icon/emoji → Strategy title → Brief description → "자세히 보기" CTA
- Cards arranged in responsive grid (masonry-style for visual interest)

**Card Categories** (distinct visual markers):
- 콜라보 전략: Star icon, warm accent
- 네이밍 전략: Typography icon, cool accent  
- 캠페인 아이디어: Megaphone icon, vibrant accent
- 시즌 마케팅: Calendar icon, seasonal accent

**Detail View** (on card click):
- Modal overlay with full strategy details
- Generated DALL-E image at top (16:9 ratio)
- Detailed description, implementation steps
- Copy/share buttons with retro icons

#### 4. Image Display
**Generated Visuals**:
- Hero-style presentation (full width on mobile, 2:3 aspect on desktop)
- Loading state: Retro TV static effect or spinning cassette animation
- Image cards with thick borders, polaroid-style frame effect
- Download and regenerate options below each image

#### 5. Navigation & Header
**Header**:
- Logo (left): Playful retro typography "역바이럴"
- Navigation (center): 홈 / 전략 생성 / 성공 사례
- CTA (right): "새 프로젝트 시작" button

**Footer**:
- Minimal, centered layout
- Links in single row, small text
- Retro pattern separator line

---

## Visual Treatment Notes

**Retro Elements**:
- Slight grain/noise texture overlay on key sections
- Geometric patterns (dots, stripes) as background accents
- Thick borders (2-3px) on interactive elements
- Playful shadows (not modern soft shadows, but offset shadows like 80s print)

**Modern Balance**:
- Clean white/light backgrounds for readability
- Generous whitespace between sections (py-16 to py-24)
- Smooth transitions (transition-all duration-300)
- Professional typography hierarchy

**Interaction States**:
- Buttons: Transform scale(1.02) on hover, slight shadow increase
- Cards: Lift effect (shadow-lg) and subtle tilt (rotate-1) on hover
- Inputs: Border color change on focus, no complex animations

---

## Page-Specific Layouts

### Landing/Home Page
**Structure**: Hero → Problem/Solution → How It Works → CTA

**Hero Section**:
- Headline: "옛날 과자를 다시 한번 바이럴시켜보세요" (bold, large)
- Subheadline: AI 기반 역바이럴 마케팅 플랫폼
- Retro-styled illustration/image of iconic Korean snacks
- Primary CTA: "무료로 시작하기" (large button, center)

**How It Works**: 3-step visual with retro numbered badges (①→②→③)

### Survey Page
Single-page form with progress indicator, centered (max-w-3xl), card-based steps

### Chat/Strategy Generation Page  
Split layout on desktop: Chat (60%) | Preview Panel (40%)
Mobile: Stacked, chat first

### Results/Strategy Cards Page
Grid of strategy cards → Click for detailed modal with images

---

## Icons
**Library**: Heroicons (via CDN)
Use outline style for most UI, solid style for active/selected states

## Images
**Hero Image**: YES - Collage of iconic Korean retro snacks (바밤바, 쫀드기, etc.) with playful arrangement
**Strategy Card Images**: Generated by DALL-E based on marketing strategies
**Chat Avatar**: Small retro mascot character (friendly, approachable)