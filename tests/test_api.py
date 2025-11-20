import pytest
from fastapi.testclient import TestClient

from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # Make a shallow copy of initial participants to restore after each test
    original = {k: v["participants"][:] for k, v in activities.items()}
    yield
    for k, parts in original.items():
        activities[k]["participants"] = parts[:]


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unsubscribe():
    activity = "Chess Club"
    email = "testuser@mergington.edu"

    # Ensure not already signed
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # Signing again should return 400
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400

    # Now unregister
    resp3 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp3.status_code == 200
    assert email not in activities[activity]["participants"]


def test_unsubscribe_nonexistent():
    activity = "Chess Club"
    email = "noone@mergington.edu"
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 404


def test_signup_invalid_activity():
    resp = client.post("/activities/NonExistent/signup?email=user@x.com")
    assert resp.status_code == 404


def test_unsubscribe_invalid_activity():
    resp = client.delete("/activities/NonExistent/participants?email=user@x.com")
    assert resp.status_code == 404
