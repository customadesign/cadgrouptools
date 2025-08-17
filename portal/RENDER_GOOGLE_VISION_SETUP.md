# Google Vision API Setup for Render Deployment

## Overview
This guide explains how to configure Google Vision API for OCR functionality when deploying to Render. The application supports two authentication methods:

1. **API Key Authentication** (Simpler, recommended for getting started)
2. **Service Account Authentication** (More secure, recommended for production)

## Current Setup Status
You have provided:
- ✅ Project ID: `796763265166`
- ✅ API Key: `AIzaSyAP8XJK5tqCpUMPu4ALYgfBtROSIuZ9-Kw`
- ❌ Service Account JSON (currently has incorrect file path)

## Method 1: Using API Key (Recommended for Quick Setup)

### Environment Variables to Set in Render:

1. **GOOGLE_VISION_API_KEY**
   - Value: `AIzaSyAP8XJK5tqCpUMPu4ALYgfBtROSIuZ9-Kw`
   - This is your Vision API key

2. **GOOGLE_PROJECT_ID** (Optional but recommended)
   - Value: `796763265166`
   - Your Google Cloud Project ID

### Steps to Configure in Render:

1. Go to your Render dashboard
2. Select your web service
3. Navigate to "Environment" tab
4. Add the environment variables:
   - Click "Add Environment Variable"
   - Key: `GOOGLE_VISION_API_KEY`
   - Value: `AIzaSyAP8XJK5tqCpUMPu4ALYgfBtROSIuZ9-Kw`
   - Click "Add Environment Variable" again
   - Key: `GOOGLE_PROJECT_ID`
   - Value: `796763265166`
5. Save changes (your service will automatically redeploy)

## Method 2: Using Service Account (More Secure)

### Why Service Account is More Secure:
- API keys can be used by anyone who has them
- Service accounts provide more granular permission control
- Better for production environments

### How to Get Service Account JSON:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Select your project (ID: 796763265166)

2. **Create a Service Account**
   - Navigate to "IAM & Admin" → "Service Accounts"
   - Click "CREATE SERVICE ACCOUNT"
   - Name: `vision-api-service` (or any name you prefer)
   - Description: "Service account for Vision API OCR"
   - Click "CREATE AND CONTINUE"

3. **Grant Permissions**
   - Select role: "Cloud Vision API User" or "Cloud Vision Editor"
   - Click "CONTINUE"
   - Click "DONE"

4. **Create and Download the Key**
   - Find your newly created service account in the list
   - Click on the service account email
   - Go to "KEYS" tab
   - Click "ADD KEY" → "Create new key"
   - Select "JSON" format
   - Click "CREATE"
   - A JSON file will download to your computer

5. **Prepare JSON for Render**
   - Open the downloaded JSON file in a text editor
   - Copy the ENTIRE contents (it should start with `{` and end with `}`)

### Configure Service Account in Render:

1. Go to your Render dashboard
2. Select your web service
3. Navigate to "Environment" tab
4. Remove or update these variables:
   - **DELETE** the incorrect `GOOGLE_APPLICATION_CREDENTIALS` that has `/path/to/credentials.json`
   - Add new environment variable:
     - Key: `GOOGLE_APPLICATION_CREDENTIALS`
     - Value: Paste the ENTIRE JSON content (not the file path!)
   - Keep or add:
     - Key: `GOOGLE_PROJECT_ID`
     - Value: `796763265166`

### Example of what the JSON should look like:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@project.iam.gserviceaccount.com",
  "client_id": "1234567890",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Important Notes for Render

### ❌ Common Mistakes to Avoid:
1. **Don't use file paths** - Render doesn't have access to local files
   - Wrong: `GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json`
   - Right: `GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}`

2. **Don't forget quotes in JSON** - Make sure the JSON is valid
   - Test it at https://jsonlint.com before pasting

3. **Don't mix authentication methods** - Use either API Key OR Service Account, not both

### ✅ Best Practices:
1. Start with API Key for quick testing
2. Switch to Service Account for production
3. Keep your API keys and service account JSON secure
4. Regularly rotate your credentials

## Testing Your Configuration

After setting up the environment variables:

1. Your service will automatically redeploy on Render
2. Check the logs for confirmation messages:
   - API Key: "Google Vision API initialized with API key"
   - Service Account: "Google Vision client initialized with service account"
3. Upload an image to test OCR functionality

## Troubleshooting

### If OCR is not working:

1. **Check Render Logs**
   - Look for initialization messages
   - Check for error messages about credentials

2. **Verify API is Enabled**
   - Go to https://console.cloud.google.com/apis/library
   - Search for "Cloud Vision API"
   - Make sure it's enabled for your project

3. **Check Quotas**
   - API Key has usage limits
   - Monitor at https://console.cloud.google.com/apis/api/vision.googleapis.com/quotas

4. **Common Error Messages:**
   - "API key not valid" - Check if key is correct and Vision API is enabled
   - "Invalid service account JSON" - JSON might be malformed or incomplete
   - "Permission denied" - Service account needs Vision API permissions

## Security Recommendations

1. **For Production:**
   - Use Service Account instead of API Key
   - Restrict API Key to specific domains/IPs if using API Key
   - Enable only required Google Cloud APIs

2. **API Key Restrictions (if using Method 1):**
   - Go to https://console.cloud.google.com/apis/credentials
   - Click on your API key
   - Under "Application restrictions", select "HTTP referrers"
   - Add your Render URL: `https://your-app.onrender.com/*`

## Support

If you continue to have issues:
1. Check Render deployment logs
2. Verify environment variables are set correctly
3. Ensure Google Cloud Vision API is enabled
4. Check API quotas and billing status

The application will now automatically detect which authentication method you're using based on the environment variables you provide.