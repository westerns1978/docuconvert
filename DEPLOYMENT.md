# Deployment Instructions

DocuConvert AI is now a two-tier application:
1. **Frontend**: React SPA (Vite)
2. **Backend**: Python FastAPI (MarkItDown)

Both can be deployed to Google Cloud Run.

## 1. Deploying the Backend (FastAPI)

The backend handles Word, Excel, PowerPoint, Images, Audio, ZIPs, and YouTube URLs.

```bash
cd backend

# Submit the build and deploy to Cloud Run
gcloud run deploy docuconvert-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1
```

*Note: We allocate 2Gi of memory because OCR and Audio transcription can be memory-intensive.*

Once deployed, copy the **Service URL** provided by Cloud Run (e.g., `https://docuconvert-backend-xyz.a.run.app`).

## 2. Deploying the Frontend (React)

The frontend handles PDFs directly via the Gemini API and routes other formats to the backend.

1. Set the environment variables for your frontend deployment:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `VITE_CONVERT_API_URL`: The URL of your deployed backend from Step 1.

2. Deploy the frontend to Cloud Run:

```bash
# From the root directory
gcloud run deploy docuconvert-frontend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="VITE_CONVERT_API_URL=https://docuconvert-backend-xyz.a.run.app" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest"
```

## Local Development

To run both services locally:

**Terminal 1 (Backend):**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
# In the root directory
export VITE_CONVERT_API_URL=http://localhost:8000
npm run dev
```
