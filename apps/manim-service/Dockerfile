# Stage 1: Builder
FROM python:3.12-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    pkg-config \
    python3-dev \
    build-essential \
    gcc \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-xetex \
    dvisvgm \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and pip.conf
COPY requirements.txt .
COPY pip.conf /etc/pip.conf

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --default-timeout=600 -r requirements.txt

# Stage 2: Production
FROM python:3.12-slim

# Install runtime dependencies (subset of builder dependencies)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    pkg-config     texlive-latex-base     texlive-fonts-recommended     texlive-xetex     dvisvgm \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user and group
RUN groupadd --system manimgroup && useradd --system --gid manimgroup manimuser

# Set working directory
WORKDIR /app

# Copy installed Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy the rest of the app
COPY ./app .

# Set permissions and switch to non-root user
RUN mkdir -p /app/media && chown manimuser:manimgroup /app/media
USER manimuser

# Expose FastAPI port
EXPOSE 8080

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

