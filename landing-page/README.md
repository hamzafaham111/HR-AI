# HR-AI Landing Page

A modern, professional landing page for the HR-AI recruitment platform built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion.

## ✨ Features

- 🎨 **Modern Design**: Clean, professional design with smooth animations
- ⚡ **Performance Optimized**: Fast loading times with Next.js optimizations
- 📱 **Fully Responsive**: Perfect on mobile, tablet, and desktop
- 🎭 **Smooth Animations**: Framer Motion animations and micro-interactions
- 🔍 **SEO Optimized**: Meta tags, structured data, and semantic HTML
- ♿ **Accessible**: WCAG compliant with keyboard navigation
- 🎯 **Conversion Focused**: Multiple CTAs, email capture, social proof
- 🚀 **Production Ready**: Optimized for deployment

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Set environment variables (optional):
Create a `.env.local` file:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:8080
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:8080](http://localhost:8080) in your browser.

## 📦 Building for Production

```bash
npm run build
npm start
```

## 🎨 Key Improvements

### SEO Enhancements
- ✅ Comprehensive meta tags (Open Graph, Twitter Cards)
- ✅ Structured data (JSON-LD) for SoftwareApplication and Organization
- ✅ Semantic HTML structure
- ✅ Optimized page titles and descriptions
- ✅ Canonical URLs
- ✅ Robots.txt ready

### UX/Animation Improvements
- ✅ Smooth scroll animations with Intersection Observer
- ✅ Animated counters for statistics
- ✅ Hover effects and micro-interactions
- ✅ Scroll-to-top button
- ✅ Parallax effects
- ✅ Loading states
- ✅ Interactive FAQ accordion

### Conversion-Focused Elements
- ✅ Multiple strategic CTAs throughout the page
- ✅ Email capture form with validation
- ✅ Trust indicators (no credit card, free trial, cancel anytime)
- ✅ Social proof (testimonials, client logos)
- ✅ Animated statistics
- ✅ Clear value propositions
- ✅ FAQ section to address concerns

### Performance Optimizations
- ✅ Next.js Image optimization ready
- ✅ Code splitting
- ✅ Lazy loading with Intersection Observer
- ✅ Optimized animations
- ✅ Compressed assets
- ✅ Security headers

## 🛠️ Customization

### Update Main App URL

Update the `NEXT_PUBLIC_APP_URL` environment variable or modify links in `app/page.tsx`:

```tsx
href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
```

### Customize Colors

Edit `tailwind.config.ts` to change the color scheme:

```ts
colors: {
  primary: {
    // Your custom colors
  }
}
```

### Update Content

All content is in `app/page.tsx`. You can easily modify:
- Features list
- Benefits
- Stats
- Testimonials
- FAQs
- Footer links

## 📊 Project Structure

```
landing-page/
├── app/
│   ├── layout.tsx      # Root layout with SEO metadata
│   ├── page.tsx        # Main landing page
│   └── globals.css     # Global styles
├── public/             # Static assets
├── next.config.js      # Next.js configuration
├── tailwind.config.ts  # Tailwind CSS configuration
└── package.json        # Dependencies
```

## 🚀 Deployment

This landing page can be deployed separately from your main application. Recommended platforms:

- **Vercel** (recommended for Next.js) - One-click deployment
- **Netlify** - Easy deployment with Git integration
- **AWS Amplify** - AWS integration
- **Any static hosting service**

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_APP_URL` - Your main app URL
   - `NEXT_PUBLIC_SITE_URL` - Landing page URL
4. Deploy!

## 🎯 Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animation library
- **React Intersection Observer** - Scroll animations
- **Lucide React** - Icon library

## 📈 Analytics Integration

To add analytics, update `app/layout.tsx`:

```tsx
<Script
  strategy="afterInteractive"
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
/>
```

## 🔒 Security

- Security headers configured in `next.config.js`
- XSS protection
- Content type protection
- Frame options

## 📝 License

Private - All rights reserved
