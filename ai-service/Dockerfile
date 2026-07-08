FROM python:3.12-slim

WORKDIR /app

# Install core + optional deps. In the Linux image the native wheels (pymupdf,
# lxml for python-docx) are available, so Word export and richer parsers work.
COPY requirements.txt requirements-optional.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-optional.txt

COPY app ./app

EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
