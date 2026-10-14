FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY models ./models

# Hosting platforms sit behind a load balancer: trust its X-Forwarded-For so
# the rate limiter sees each visitor's real IP instead of one shared proxy IP
# (read by uvicorn). Narrow to the proxy's IP range if the container is ever
# reachable directly, otherwise clients could spoof their IP.
ENV FORWARDED_ALLOW_IPS="*"

EXPOSE 8000
# Most hosts (Render, Railway, Fly, Cloud Run) assign the port via $PORT.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers"]
