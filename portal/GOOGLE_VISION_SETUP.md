# Google Vision API Setup for Render

## Your Valid Credentials

Your Google Vision API key has been tested and verified to work correctly:

- **API Key**: `AIzaSyAP8XJK5tqCpUMPu4ALYgfBtROSIuZ9-Kw`
- **Project ID**: `customadesign.com:api-project-796763265166`

## Important Note About Project ID

While your full project ID is `customadesign.com:api-project-796763265166`, the API key authentication method doesn't require the project ID header. The API key is already associated with your project.

## Setup Instructions for Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your service**: cadgrouptools
3. **Navigate to Environment tab**
4. **Add these environment variables**:

```
GOOGLE_VISION_API_KEY=AIzaSyAP8XJK5tqCpUMPu4ALYgfBtROSIuZ9-Kw
```

That's it! You only need the API key. The system will automatically use it for OCR operations.

## What This Enables

With the Google Vision API configured:
- ✅ OCR for scanned PDF documents
- ✅ OCR for images (PNG, JPG, etc.)
- ✅ Bank statement screenshots
- ✅ Any image with text

## Testing After Deployment

Once deployed, test OCR by:
1. Go to https://cadgrouptools.onrender.com/accounting/upload
2. Upload an image or scanned PDF
3. The system should extract text successfully
4. If a statement fails, the retry button will now work

## Troubleshooting

If OCR still doesn't work:
1. Check Render logs for error messages
2. Ensure the environment variable is saved correctly
3. Wait a few minutes for the deployment to complete
4. Try uploading a clear image with visible text

## Note on PDF Files

PDF files with embedded text (not scanned) don't require Google Vision API. They use the built-in pdf-parse library which works without any API keys.