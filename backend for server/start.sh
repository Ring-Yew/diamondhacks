#!/bin/bash
# Install dependencies and start the backend

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
