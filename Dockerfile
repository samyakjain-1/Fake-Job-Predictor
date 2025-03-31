# Use official Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose Flask port
EXPOSE 5000

# Run the Flask app with gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
