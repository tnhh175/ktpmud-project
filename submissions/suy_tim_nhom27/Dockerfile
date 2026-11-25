FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 MVP_HOSTED=1
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --user-group --uid 10001 demo
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/__init__.py src/
COPY src/mvp/ src/mvp/
COPY scripts/run_mvp.py scripts/bootstrap_hosted_mvp.py scripts/
COPY api/hf-code-catalog-0.1.json api/
COPY api/schemas/hf-ai-input-1.0.schema.json api/schemas/
COPY database/schema.sql database/seed.sql database/
COPY database/migrations/005_visit_amendment_reopen.sql database/migrations/
RUN python -c "import zipfile; zipfile.ZipFile('src/mvp/workflow-image-assets.zip').extractall('.')"
COPY web/index.html web/config.js web/api-client.js web/app.js web/styles.css web/static-runtime.js web/catalog-seed.json web/
USER demo
CMD ["python", "scripts/run_mvp.py"]
