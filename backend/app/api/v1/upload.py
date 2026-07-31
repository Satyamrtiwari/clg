import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from app.core.config import settings
from app.core.security import require_role
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["Uploads"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

@router.post("/image")
async def upload_product_image(
    file: UploadFile = File(...),
    admin_user: User = Depends(require_role(["ADMIN", "CASHIER"]))
):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read and validate size
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB"
        )

    # Generate unique filename
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    return {"image_url": f"/uploads/{filename}"}
