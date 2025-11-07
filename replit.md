# 역바이럴 (Reverse Viral) 마케팅 플랫폼

## Overview

역바이럴 is an AI-powered marketing platform designed to help revitalize discontinued or underperforming Korean snack products through modern viral marketing strategies. The platform leverages OpenAI's GPT for conversational marketing strategy generation and DALL-E for creating visual marketing materials. Users complete a survey about their product, engage in AI-guided chat conversations to refine strategies, and receive comprehensive marketing plans with visual assets.

The application targets Korean B2B clients (snack manufacturers, marketing agencies) seeking to rebrand nostalgic products for modern audiences by combining retro aesthetics ("뉴트로" - newtro) with contemporary viral marketing tactics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript in SPA mode

**Routing**: wouter for client-side routing with four main pages:
- `/` - Landing page with hero section and feature overview
- `/survey` - Multi-step form for project creation
- `/chat/:id` - Card-based strategy selection interface (replaced conversational flow)
- `/results/:id` - Visual display of generated marketing strategies (legacy)

**UI Component System**: shadcn/ui (Radix UI primitives) with custom "new-york" theme configuration
- Component library includes 40+ pre-built components
- Custom design tokens for retro-modern Korean aesthetic
- Pretendard font for body text, Gaegu/Gmarket Sans for accent typography
- Tailwind CSS for styling with custom color system and border radius values

**State Management**: 
- TanStack Query (React Query) for server state management
- React Hook Form with Zod validation for form state
- No global client state - server-driven architecture

**Design System**: Retro-modern ("뉴트로") aesthetic combining:
- 1980s-90s Korean snack packaging visual language
- Modern SaaS interface patterns
- Custom color palette with thick borders and playful shadows
- Age-specific and seasonal marketing considerations built into UI

### Backend Architecture

**Runtime**: Node.js with Express.js server

**API Design**: RESTful endpoints with JSON responses:
- `POST /api/projects` - Create new marketing project and immediately generate strategy cards
- `GET /api/projects/:id` - Fetch project details
- `GET /api/messages/:id` - Retrieve messages with strategy card metadata
- `POST /api/strategies/detail/:projectId` - Generate detailed strategy for selected card
- `GET /api/strategies/:id` - Fetch generated strategies (legacy)
- `GET /api/sales` - Fetch product sales data
- `GET /api/sales/top` - Get top-ranked products

**Data Storage Strategy**: 
- In-memory storage implementation (`MemStorage` class) for development
- Drizzle ORM schema defined for PostgreSQL migration path
- Storage abstraction layer (`IStorage` interface) enables swapping implementations
- Three core entities: Projects, Messages, Strategies

**AI Integration Architecture**:
- OpenAI API accessed directly with OPENAI_API_KEY
- GPT-4.1 for marketing strategy generation
- DALL-E 3 for marketing visual generation (currently disabled - placeholder only)
- **Prompt Engineering System** (server/prompts.ts):
  - Strategy cards prompt: immediate generation of 4 category cards (시즌마케팅, 콜라보, 네이밍, 굿즈)
  - Detailed strategy prompt: generates full implementation plan with markdown
  - JSON parsing for structured data with resilient extraction
  - No generic KPIs/budgets per user requirements
- Retry logic with exponential backoff for rate limiting (p-retry)
- Markdown rendering with ReactMarkdown + remark-gfm on frontend
- **New Card-Based Flow**:
  - Project creation → Immediate strategy card generation (no greeting message)
  - 4 clickable cards displayed with icon, title, summary, viral point
  - Card selection → Detailed strategy with markdown rendering
  - Modal/Dialog display for detailed strategies

**Error Handling**: Custom middleware for request logging, JSON parsing with raw body capture, structured error responses

### Database Schema (Drizzle ORM)

**Projects Table**:
- Stores product metadata: name, target age group (10대/20대/30대), marketing season, current status
- **conversationStage field**: tracks progress (greeting, diagnosis, candidates, detailed)
- UUID primary keys with auto-generation
- Created timestamp tracking

**Messages Table**:
- Conversational history between user and AI assistant
- Foreign key relationship to projects
- Role-based storage (user/assistant)
- **metadata field**: JSON storage for stage info, images, category selection

**Strategies Table**:
- AI-generated marketing strategies with categorization
- Types: 콜라보 (collaboration), 네이밍 (naming), 캠페인 (campaign), 시즌마케팅 (seasonal)
- Stores DALL-E image URLs, implementation details (JSON), and hashtags
- One-to-many relationship with projects

**Migration Strategy**: Drizzle Kit configured for PostgreSQL with migrations output to `/migrations` directory

### Build and Development Workflow

**Development Mode**: 
- Vite dev server in middleware mode integrated with Express
- HMR (Hot Module Replacement) enabled through Vite
- TypeScript transpilation via tsx for server code
- Server-side rendering of index.html template

**Production Build**:
- Client: Vite builds React app to `dist/public`
- Server: esbuild bundles Express server to `dist/index.js` with ESM format
- Static file serving in production mode
- Environment-based configuration switching

**Type Safety**: Shared TypeScript types between client/server via `@shared` path alias

## External Dependencies

### AI Services

**OpenAI via Replit AI Integrations**:
- Base URL and API key provided through Replit environment variables
- GPT-4 model for chat completions with streaming support
- DALL-E 3 for 1024x1024 marketing image generation
- Custom retry logic for rate limit handling

### Database

**PostgreSQL** (via Neon serverless driver):
- Connection string from `DATABASE_URL` environment variable
- Drizzle ORM as query builder and migration tool
- Currently using in-memory storage with migration path prepared

### UI Component Libraries

**Radix UI Primitives** (v1.x):
- 25+ headless component primitives for accessibility
- Dialog, Dropdown, Popover, Toast, Select, and form components
- Provides keyboard navigation and ARIA compliance

**shadcn/ui Configuration**:
- "new-york" style variant
- Custom Tailwind theme with Korean typography
- Path aliases for components, utils, hooks

### Additional Third-party Services

**Fonts**:
- Pretendard (Korean) via jsDelivr CDN
- Gaegu (Google Fonts) for retro Korean accent typography

**Development Tools**:
- Replit-specific plugins: Cartographer (visual editing), Dev Banner, Runtime Error Modal
- p-limit for concurrency control
- p-retry for resilient API calls

### Session Management

**express-session** with PostgreSQL store:
- connect-pg-simple for session persistence
- Session data stored in database (when migrated from in-memory)