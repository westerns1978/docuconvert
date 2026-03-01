from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from markitdown import MarkItDown
import tempfile
import os

app = FastAPI(title="DocuConvert AI - MarkItDown Backend")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MarkItDown
md = MarkItDown()

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

@app.post("/convert")
async def convert_file(file: UploadFile = File(None), url: str = Form(None)):
    """
    Converts a file or YouTube URL to Markdown using MarkItDown.
    """
    if url:
        try:
            result = md.convert(url)
            return {"markdown": result.text_content, "filename": url, "format": "youtube"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process URL: {str(e)}")

    if file:
        # Read file contents and check size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large (max 20MB)")

        # Determine file extension
        _, ext = os.path.splitext(file.filename)
        
        # Write to a temporary file for MarkItDown to process
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            result = md.convert(tmp_path)
            return {
                "markdown": result.text_content, 
                "filename": file.filename, 
                "format": ext.lstrip('.') if ext else 'unknown'
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
        finally:
            # Clean up the temporary file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    raise HTTPException(status_code=400, detail="Must provide either a file or a url")

@app.get("/health")
def health_check():
    return {"status": "healthy"}
