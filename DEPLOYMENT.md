# Deployment Guide

This guide will help you deploy your Private Teacher web application to the internet.

## Build for Production

First, create an optimized production build:

```bash
npm run build
```

This will create a `dist` folder (or `build` folder based on your vite.config.ts) with all the optimized, minified files ready for deployment.

## Deployment Options

### 1. **Vercel** (Recommended - Easiest)

Vercel is the easiest option for React/Vite apps:

1. **Install Vercel CLI** (optional, you can also use the web interface):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   
   Or just go to [vercel.com](https://vercel.com), sign up, and:
   - Click "New Project"
   - Import your Git repository, or drag and drop your project folder
   - Vercel will auto-detect it's a Vite project
   - Click "Deploy"

3. **Configuration**: Vercel will automatically:
   - Detect your build command: `npm run build`
   - Set output directory: `dist` (or `build` based on vite.config.ts)
   - Configure routing for SPA

**Pros**: Free tier, automatic HTTPS, global CDN, automatic deployments from Git

### 2. **Netlify**

1. Go to [netlify.com](https://netlify.com) and sign up
2. Click "Add new site" → "Deploy manually" or connect your Git repository
3. If deploying manually:
   - Drag and drop your `dist` folder (after running `npm run build`)
4. If using Git:
   - Build command: `npm run build`
   - Publish directory: `dist` (or `build`)

**Pros**: Free tier, easy setup, good for static sites

### 3. **GitHub Pages**

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add scripts to package.json**:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Update vite.config.ts**:
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/', // Replace with your GitHub repo name
     // ... rest of config
   })
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

**Pros**: Free, uses GitHub infrastructure

### 4. **Cloudflare Pages**

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Sign up and connect your Git repository
3. Configure:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Deploy

**Pros**: Fast CDN, free tier available

### 5. **Firebase Hosting**

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login**:
   ```bash
   firebase login
   ```

3. **Initialize**:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Public directory: `dist`
   - Single-page app: Yes
   - Build script: `npm run build`

4. **Deploy**:
   ```bash
   npm run build
   firebase deploy
   ```

### 6. **Amazon S3 + CloudFront**

For more control and scalability:

1. Build your app: `npm run build`
2. Upload `dist` folder to S3 bucket
3. Enable static website hosting
4. Set up CloudFront distribution for CDN

## Important Notes

### Environment Variables

If you need environment variables:

1. Create a `.env` file for local development
2. Create a `.env.production` for production
3. Use `import.meta.env.VITE_YOUR_VARIABLE` to access them
4. Add environment variables in your hosting platform's dashboard

### Vite Configuration

Your current `vite.config.ts` is set up correctly. The build output goes to `build` directory by default based on your config.

### Routing

If you add client-side routing (React Router):
- Ensure your hosting provider supports SPA routing
- Configure redirect rules to serve `index.html` for all routes

### CORS & API

If connecting to external APIs:
- Ensure CORS is properly configured on the API server
- Use environment variables for API endpoints

## Quick Start (Recommended: Vercel)

The fastest way to get online:

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to vercel.com
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Deploy"
   - Done! Your app will be live in ~2 minutes

## Testing Your Deployment

After deploying:

1. Check your app loads correctly
2. Test theme switching
3. Test login functionality
4. Test credits management
5. Check mobile responsiveness

## Custom Domain

Most platforms allow you to add a custom domain:
- Vercel: Settings → Domains
- Netlify: Domain settings
- Cloudflare Pages: Custom domains

## Need Help?

- Vite Deployment: https://vitejs.dev/guide/static-deploy.html
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com

Your app is ready to go live! 🚀

