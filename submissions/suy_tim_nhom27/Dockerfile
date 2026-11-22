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
COPY database/schema.sql database/seed.sql database/
COPY database/migrations/005_visit_amendment_reopen.sql database/migrations/
COPY web/index.html web/config.js web/api-client.js web/app.js web/styles.css web/
USER demo
CMD ["python", "scripts/run_mvp.py"]
