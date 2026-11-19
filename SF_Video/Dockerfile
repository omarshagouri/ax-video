FROM mcr.microsoft.com/playwright/python:v1.50.0-noble
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.in .
RUN pip install --no-cache-dir -r requirements.in
COPY app.py background.png ./
COPY Cards ./Cards
ENV PORT=8080
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
