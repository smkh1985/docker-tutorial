FROM python:3.13-slim
WORKDIR /app
ENV SITE_NAME="My site"
COPY . .
EXPOSE 8000
CMD ["python", "-m", "http.server", "8000"]
