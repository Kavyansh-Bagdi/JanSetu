#!/usr/bin/env python3
"""
Mock Roads Data Insertion Script
This script makes HTTP POST requests to add sample roads to the database.
Run this after starting the server to populate test data.

Usage: python mock_roads.py
"""

import requests
import json
from datetime import date, timedelta

# API endpoint
BASE_URL = "http://localhost:8000"
ADD_ROAD_ENDPOINT = f"{BASE_URL}/employee/add_road"

# Mock roads data
MOCK_ROADS = [
    {
        "name": "Delhi-Gurgaon Highway Section",
        "builder_id": 4,
        "cost": 5000000,
        "started_date": "2024-01-15",
        "polyline": [
            {"lat": 28.6139, "lng": 77.2090},
            {"lat": 28.6149, "lng": 77.2100},
            {"lat": 28.6159, "lng": 77.2110},
            {"lat": 28.6169, "lng": 77.2120},
            {"lat": 28.6179, "lng": 77.2130}
        ],
        "manager_unique_id": 1,
        "inspector_assigned": 2
    },
    {
        "name": "Mumbai Coastal Road - Phase 1",
        "builder_id": 4,
        "cost": 8500000,
        "started_date": "2024-02-01",
        "polyline": [
            {"lat": 19.0760, "lng": 72.8777},
            {"lat": 19.0770, "lng": 72.8787},
            {"lat": 19.0780, "lng": 72.8797},
            {"lat": 19.0790, "lng": 72.8807},
            {"lat": 19.0800, "lng": 72.8817},
            {"lat": 19.0810, "lng": 72.8827}
        ],
        "manager_unique_id": 1,
        "inspector_assigned": 2,
        "ended_date": "2024-06-30"
    },
    {
        "name": "Bangalore ORR Connector",
        "builder_id": 4,
        "cost": 3500000,
        "started_date": "2024-03-10",
        "polyline": [
            {"lat": 12.9716, "lng": 77.5946},
            {"lat": 12.9726, "lng": 77.5956},
            {"lat": 12.9736, "lng": 77.5966},
            {"lat": 12.9746, "lng": 77.5976}
        ],
        "manager_unique_id": 1,
        "inspector_assigned": 2
    },
    {
        "name": "Kolkata Eastern Bypass Extension",
        "builder_id": 4,
        "cost": 4200000,
        "started_date": "2024-01-20",
        "polyline": [
            {"lat": 22.5726, "lng": 88.3639},
            {"lat": 22.5736, "lng": 88.3649},
            {"lat": 22.5746, "lng": 88.3659},
            {"lat": 22.5756, "lng": 88.3669},
            {"lat": 22.5766, "lng": 88.3679}
        ],
        "manager_unique_id": 1,
        "inspector_assigned": 2,
        "ended_date": "2024-05-15"
    },
    {
        "name": "Chennai IT Corridor Link",
        "builder_id": 4,
        "cost": 6000000,
        "started_date": "2024-04-01",
        "polyline": [
            {"lat": 13.0827, "lng": 80.2707},
            {"lat": 13.0837, "lng": 80.2717},
            {"lat": 13.0847, "lng": 80.2727},
            {"lat": 13.0857, "lng": 80.2737},
            {"lat": 13.0867, "lng": 80.2747},
            {"lat": 13.0877, "lng": 80.2757}
        ],
        "manager_unique_id": 1,
        "inspector_assigned": 2
    }
]


def add_road(road_data):
    """Make POST request to add a road"""
    try:
        response = requests.post(ADD_ROAD_ENDPOINT, json=road_data)
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Successfully added: {road_data['name']}")
            print(f"   Road ID: {result.get('road_id')}")
            return True
        else:
            print(f"❌ Failed to add: {road_data['name']}")
            print(f"   Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error: Could not connect to {BASE_URL}")
        print(f"   Make sure the server is running!")
        return False
    except Exception as e:
        print(f"❌ Error adding road: {str(e)}")
        return False


def main():
    print("=" * 60)
    print("Mock Roads Data Insertion")
    print("=" * 60)
    print(f"Target: {ADD_ROAD_ENDPOINT}")
    print(f"Total roads to add: {len(MOCK_ROADS)}\n")
    
    success_count = 0
    fail_count = 0
    
    for i, road in enumerate(MOCK_ROADS, 1):
        print(f"\n[{i}/{len(MOCK_ROADS)}] Adding road...")
        if add_road(road):
            success_count += 1
        else:
            fail_count += 1
    
    print("\n" + "=" * 60)
    print("Summary:")
    print(f"✅ Successful: {success_count}")
    print(f"❌ Failed: {fail_count}")
    print("=" * 60)


if __name__ == "__main__":
    main()
