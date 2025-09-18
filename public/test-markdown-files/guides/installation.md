# Installation Guide

This guide covers different ways to install and run MarkDown Buddy.

## 🌐 Web Version (Recommended)

### Online Access
The simplest way to use MarkDown Buddy:

1. **Open your browser** (Chrome, Firefox, Safari, Edge)
2. **Navigate to** the deployed application URL
3. **Start using immediately** - no installation required

### Browser Requirements
- **Chrome** 88+ (recommended for full features)
- **Firefox** 85+ 
- **Safari** 14+
- **Edge** 88+

## 💻 Local Development Setup

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Git** (for cloning the repository)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/markdown-buddy-react.git
   cd markdown-buddy-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3002
   ```

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 🚀 Production Deployment

### Build Process
```bash
# Create production build
npm run build

# Files are generated in /dist folder
# Deploy the contents of /dist to your web server
```

### Static Hosting Options

#### Netlify
1. **Connect your Git repository** to Netlify
2. **Set build command**: `npm run build`
3. **Set publish directory**: `dist`
4. **Deploy automatically** on push to main branch

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project directory
vercel

# Follow prompts for configuration
```

#### GitHub Pages
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

#### Apache/Nginx
```nginx
# nginx configuration
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types
        text/plain
        text/css
        text/js
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss;
}
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Commands
```bash
# Build image
docker build -t markdown-buddy .

# Run container
docker run -p 3002:80 markdown-buddy

# Using Docker Compose
docker-compose up -d
```

### Docker Compose
```yaml
version: '3.8'

services:
  markdown-buddy:
    build: .
    ports:
      - "3002:80"
    restart: unless-stopped
    
  # Optional: Add reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/nginx.conf
    depends_on:
      - markdown-buddy
```

## 📱 Progressive Web App (PWA)

### PWA Features
MarkDown Buddy includes PWA capabilities:

- **Offline support** for viewed files
- **Install to device** option
- **App-like experience** on mobile
- **Background sync** for updates

### Installation on Mobile
1. **Open in mobile browser**
2. **Look for "Add to Home Screen"** option
3. **Install the PWA** for app-like experience
4. **Use offline** for previously viewed files

## 🔧 Configuration Options

### Environment Variables
```bash
# .env file
VITE_APP_TITLE="MarkDown Buddy"
VITE_DEFAULT_LANGUAGE="de"
VITE_ANALYTICS_ID="GA_MEASUREMENT_ID"
VITE_API_BASE_URL="https://api.example.com"
```

### Build Configuration
```typescript
// vite.config.ts customization
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@emotion/react'],
          markdown: ['marked', 'highlight.js', 'mermaid']
        }
      }
    }
  }
});
```

## 🛠️ Troubleshooting Installation

### Common Issues

#### Port Already in Use
```bash
# Error: Port 3002 is already in use
# Solution: Use different port
npm run dev -- --port 3003

# Or configure in vite.config.ts
server: { port: 3003 }
```

#### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Build Failures
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and rebuild
npm run clean
npm run build
```

#### Permission Denied (Linux/macOS)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

### Browser-Specific Issues

#### Safari File Access
- **Enable Developer Menu** in Safari preferences
- **Disable security restrictions** for local development
- **Use Chrome/Firefox** for better compatibility

#### Firefox CORS Issues
```bash
# Start with CORS disabled for development
firefox --disable-web-security --user-data-dir="/tmp/firefox-dev"
```

## 📋 System Requirements

### Minimum Requirements
- **RAM**: 512MB available
- **Storage**: 100MB for source code
- **Network**: Required for initial load and updates
- **Browser**: Modern browser with JavaScript enabled

### Recommended Specifications
- **RAM**: 1GB+ available
- **Storage**: 200MB+ for development
- **Network**: Broadband for optimal experience
- **Browser**: Latest Chrome/Firefox for all features

### Performance Considerations
- **File Size**: Works best with folders containing < 1000 files
- **File Content**: Large markdown files (>1MB) may load slower
- **Diagrams**: Complex Mermaid diagrams may impact performance
- **Memory**: Browser may use 50-100MB RAM during operation

## 🔗 Related Resources

### Documentation
- [User Guide](user-guide.md) - Complete usage guide
- [Getting Started](../docs/getting-started.md) - Quick start guide
- [Troubleshooting](../docs/complex-example.md) - Common issues

### Development
- [Contributing Guidelines](../README.md) - How to contribute
- [API Documentation](../projects/project-a/details.md) - Technical details
- [Project Structure](../projects/project-a/overview.md) - Architecture overview

### Support
- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - This markdown collection
- **Examples** - Test files and demonstrations

---

**Installation Complete!** 🎉

Choose the deployment method that best fits your needs:

- **Quick Start**: Use the web version
- **Development**: Clone and run locally  
- **Production**: Deploy to your preferred hosting platform

[← User Guide](user-guide.md) | [Back to Main](../README.md)