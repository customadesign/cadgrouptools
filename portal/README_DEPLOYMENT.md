# CADGroup Internal Tools Portal - Deployment Guide

## Prerequisites for Render Deployment

1. **GitHub Repository**: Push your code to GitHub
2. **MongoDB Atlas**: Have your MongoDB connection string ready
3. **Render Account**: Sign up at [render.com](https://render.com)

## Deployment Steps

### 1. Prepare Your Repository

```bash
# Commit all changes
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Set Up Render

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `cadgroup-tools-portal`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `node .next/standalone/server.js`

### 3. Configure Environment Variables

In Render Dashboard, add these environment variables:

#### Required Variables:
- `MONGODB_URI`: Your MongoDB connection string
- `DB_NAME`: `cadtools`
- `NEXTAUTH_URL`: Your Render URL (e.g., `https://cadgroup-tools-portal.onrender.com`)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

#### Optional Variables (if using features):
- `SENDGRID_API_KEY`: For email functionality
- `SENDGRID_FROM_EMAIL`: Your sender email
- `SEMRUSH_API_KEY`: For SEO tools
- `GOOGLE_API_KEY`: For Google services
- `S3_*` variables: For file uploads

### 4. Deploy

1. Click "Create Web Service"
2. Wait for the build and deployment to complete
3. Your app will be available at the provided URL

## Post-Deployment

### Create Initial Admin User

1. Access your deployed app
2. Navigate to `/auth/signin`
3. Use the registration endpoint or database to create the first admin user

### Monitor Your App

- Check logs in Render Dashboard
- Monitor database connections
- Set up alerts for downtime

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check Node version compatibility
   - Ensure all dependencies are in package.json

2. **MongoDB Connection Issues**
   - Verify connection string format
   - Check IP whitelist in MongoDB Atlas

3. **Authentication Issues**
   - Ensure NEXTAUTH_URL matches your Render URL
   - Verify NEXTAUTH_SECRET is set

4. **Performance**
   - Consider upgrading from free tier for production
   - Enable caching and optimize database queries

## Security Checklist

- ✅ Strong NEXTAUTH_SECRET (32+ characters)
- ✅ HTTPS enabled (automatic on Render)
- ✅ Environment variables properly secured
- ✅ Database connection uses SSL
- ✅ Sensitive API keys not exposed in code

## Updating the Application

```bash
# Make changes locally
git add .
git commit -m "Update description"
git push origin main
# Render will auto-deploy
```

## Support

For issues specific to:
- **Render**: Check [Render Docs](https://render.com/docs)
- **Next.js**: See [Next.js Deployment](https://nextjs.org/docs/deployment)
- **MongoDB**: Visit [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)