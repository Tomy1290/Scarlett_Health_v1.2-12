#!/usr/bin/env python3
"""
Backend API Testing Script
Tests the FastAPI backend endpoints for the wellness tracking app
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    frontend_env_path = "/app/frontend/.env"
    try:
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip().strip('"')
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None
    return None

def test_get_root():
    """Test GET /api/ endpoint"""
    print("\n=== Testing GET /api/ ===")
    
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ Could not get backend URL from frontend/.env")
        return False
    
    url = f"{backend_url}/api/"
    print(f"Testing URL: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print("✅ GET /api/ test PASSED")
                return True
            else:
                print(f"❌ GET /api/ test FAILED - Expected message: 'Hello World', got: {data}")
                return False
        else:
            print(f"❌ GET /api/ test FAILED - Status code: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ GET /api/ test FAILED - Request error: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ GET /api/ test FAILED - JSON decode error: {e}")
        return False

def test_post_status():
    """Test POST /api/status endpoint"""
    print("\n=== Testing POST /api/status ===")
    
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ Could not get backend URL from frontend/.env")
        return False
    
    url = f"{backend_url}/api/status"
    print(f"Testing URL: {url}")
    
    payload = {"client_name": "qa"}
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "client_name" in data and "timestamp" in data:
                if data["client_name"] == "qa":
                    print("✅ POST /api/status test PASSED")
                    return True, data
                else:
                    print(f"❌ POST /api/status test FAILED - Wrong client_name: {data['client_name']}")
                    return False, None
            else:
                print(f"❌ POST /api/status test FAILED - Missing required fields in response: {data}")
                return False, None
        else:
            print(f"❌ POST /api/status test FAILED - Status code: {response.status_code}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ POST /api/status test FAILED - Request error: {e}")
        return False, None
    except json.JSONDecodeError as e:
        print(f"❌ POST /api/status test FAILED - JSON decode error: {e}")
        return False, None

def test_get_status():
    """Test GET /api/status endpoint"""
    print("\n=== Testing GET /api/status ===")
    
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ Could not get backend URL from frontend/.env")
        return False
    
    url = f"{backend_url}/api/status"
    print(f"Testing URL: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"✅ GET /api/status test PASSED - Retrieved {len(data)} status checks")
                # Check if our test data is in the response
                qa_entries = [item for item in data if item.get("client_name") == "qa"]
                if qa_entries:
                    print(f"✅ Found {len(qa_entries)} 'qa' entries in the database")
                else:
                    print("⚠️  No 'qa' entries found - this might be expected if database was cleared")
                return True
            else:
                print(f"❌ GET /api/status test FAILED - Expected list, got: {type(data)}")
                return False
        else:
            print(f"❌ GET /api/status test FAILED - Status code: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ GET /api/status test FAILED - Request error: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ GET /api/status test FAILED - JSON decode error: {e}")
        return False

def test_post_chat():
    """Test POST /api/chat endpoint with Emergent LLM Key integration"""
    print("\n=== Testing POST /api/chat ===")
    
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ Could not get backend URL from frontend/.env")
        return False
    
    url = f"{backend_url}/api/chat"
    print(f"Testing URL: {url}")
    
    # Test payload as specified in the review request
    payload = {
        "mode": "greeting",
        "language": "de",
        "model": "gpt-4o-mini",
        "summary": {}
    }
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "text" in data and isinstance(data["text"], str) and len(data["text"].strip()) > 0:
                print("✅ POST /api/chat test PASSED - LLM integration working")
                print(f"✅ Generated response: {data['text'][:100]}...")
                return True
            else:
                print(f"❌ POST /api/chat test FAILED - Invalid response format: {data}")
                return False
        else:
            print(f"❌ POST /api/chat test FAILED - Status code: {response.status_code}")
            if response.status_code == 500:
                print("⚠️  This might indicate an issue with the Emergent LLM Key integration")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ POST /api/chat test FAILED - Request error: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ POST /api/chat test FAILED - JSON decode error: {e}")
        return False

def test_post_chat_with_messages():
    """Test POST /api/chat endpoint with chat mode and messages"""
    print("\n=== Testing POST /api/chat (Chat Mode) ===")
    
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ Could not get backend URL from frontend/.env")
        return False
    
    url = f"{backend_url}/api/chat"
    print(f"Testing URL: {url}")
    
    # Test chat mode with messages
    payload = {
        "mode": "chat",
        "language": "en",
        "model": "gpt-4o-mini",
        "summary": {"weight": "70kg", "activity": "moderate"},
        "messages": [
            {"role": "user", "content": "What's a good breakfast for weight management?"}
        ]
    }
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "text" in data and isinstance(data["text"], str) and len(data["text"].strip()) > 0:
                print("✅ POST /api/chat (Chat Mode) test PASSED")
                print(f"✅ Generated response: {data['text'][:100]}...")
                return True
            else:
                print(f"❌ POST /api/chat (Chat Mode) test FAILED - Invalid response format: {data}")
                return False
        else:
            print(f"❌ POST /api/chat (Chat Mode) test FAILED - Status code: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ POST /api/chat (Chat Mode) test FAILED - Request error: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ POST /api/chat (Chat Mode) test FAILED - JSON decode error: {e}")
        return False

def check_mongodb_connection():
    """Check if MongoDB is accessible by testing the backend endpoints"""
    print("\n=== Checking MongoDB Connection ===")
    
    # Try to post and then get to verify MongoDB is working
    post_success, post_data = test_post_status()
    if not post_success:
        print("❌ MongoDB connection test FAILED - Could not create status check")
        return False
    
    get_success = test_get_status()
    if not get_success:
        print("❌ MongoDB connection test FAILED - Could not retrieve status checks")
        return False
    
    print("✅ MongoDB connection test PASSED")
    return True

def main():
    """Run all backend tests"""
    print("🚀 Starting Backend API Tests")
    print("=" * 50)
    
    # Test results
    results = {}
    
    # Test 1: GET /api/
    results['get_root'] = test_get_root()
    
    # Test 2: POST /api/status
    post_success, _ = test_post_status()
    results['post_status'] = post_success
    
    # Test 3: GET /api/status
    results['get_status'] = test_get_status()
    
    # Test 4: POST /api/chat (Greeting Mode)
    results['post_chat_greeting'] = test_post_chat()
    
    # Test 5: POST /api/chat (Chat Mode with Messages)
    results['post_chat_messages'] = test_post_chat_with_messages()
    
    # Test 6: MongoDB connection (implicit through POST/GET)
    results['mongodb_connection'] = results['post_status'] and results['get_status']
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests PASSED!")
        return 0
    else:
        print("⚠️  Some backend tests FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(main())