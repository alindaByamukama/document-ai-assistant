"""
Basic tests for Document AI Assistant backend
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    """Test that health check endpoint returns 200"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_process_missing_file():
    """Test that missing file returns error"""
    response = client.post("/process")
    assert response.status_code == 422  # Validation error


def test_process_invalid_filetype():
    """Test that invalid file type is rejected"""
    # Send a request with invalid file type
    response = client.post(
        "/process",
        files={"file": ("test.exe", b"fake content", "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_process_empty_file():
    """Test that empty file is rejected"""
    response = client.post(
        "/process",
        files={"file": ("empty.txt", b"", "text/plain")}
    )
    # Should return 400 because extracted text is empty
    assert response.status_code in [400, 500]