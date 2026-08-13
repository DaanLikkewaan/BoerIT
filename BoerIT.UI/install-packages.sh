#!/bin/bash
# BoerIT.UI — npm package installation
# Run from the root of your Next.js project

echo "Installing core dependencies..."
npm install \
  zustand \
  swr \
  zod \
  react-hook-form \
  @hookform/resolvers \
  sonner \
  lucide-react \
  clsx \
  tailwind-merge

echo ""
echo "Installing dev dependencies..."
npm install -D \
  tailwindcss \
  postcss \
  autoprefixer \
  @types/node \
  @types/react \
  @types/react-dom \
  typescript

echo ""
echo "Initialising shadcn/ui..."
echo "Run the following command separately and follow the prompts:"
echo ""
echo "  npx shadcn@latest init"
echo ""
echo "Recommended shadcn/ui answers:"
echo "  Style:           Default"
echo "  Base color:      Stone"
echo "  CSS variables:   Yes"
echo ""
echo "Then add individual components as you need them, e.g.:"
echo "  npx shadcn@latest add button"
echo "  npx shadcn@latest add input"
echo "  npx shadcn@latest add dialog"
echo "  npx shadcn@latest add select"
echo "  npx shadcn@latest add badge"
echo ""
echo "All packages installed. Next steps:"
echo "  1. Copy .env.local.example to .env.local and set NEXT_PUBLIC_API_URL"
echo "  2. Run: npx shadcn@latest init"
echo "  3. Run: npm run dev"
