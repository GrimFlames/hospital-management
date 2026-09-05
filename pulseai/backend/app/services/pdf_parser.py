import io
from typing import Tuple
from pypdf import PdfReader

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> Tuple[str, int]:
    """
    Safely extracts all text and total page count from an in-memory PDF byte stream.
    Eliminates disk I/O, temporary file residue, and memory leaks.
    """
    if not pdf_bytes:
        return "", 0
    
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_pages = []
        page_count = len(reader.pages)
        
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                extracted_pages.append(text.strip())
                
        full_text = "\n\n".join(extracted_pages)
        return full_text, page_count
    except Exception as e:
        raise ValueError(f"Failed to parse PDF byte stream: {str(e)}")
