# GlobeTrotter Backend API Documentation (Person A Scope)

This document describes the API endpoints owned by **Person A**. All routes are prefixed with `/api`.

---

## 🔐 Authentication Endpoints

### 1. Register User
*   **Route**: `POST /api/auth/signup`
*   **Access**: Public
*   **Request Body**:
    ```json
    {
      "name": "Alice Smith",
      "email": "alice@example.com",
      "password": "securepassword123"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "User registered successfully.",
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": 1,
          "name": "Alice Smith",
          "email": "alice@example.com",
          "role": "user",
          "language": "en"
        }
      }
    }
    ```

### 2. Login User
*   **Route**: `POST /api/auth/login`
*   **Access**: Public
*   **Request Body**:
    ```json
    {
      "email": "alice@example.com",
      "password": "securepassword123"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Login successful.",
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": 1,
          "name": "Alice Smith",
          "email": "alice@example.com",
          "role": "user",
          "language": "en"
        }
      }
    }
    ```

### 3. Forgot Password (Stub)
*   **Route**: `POST /api/auth/forgot-password`
*   **Access**: Public
*   **Request Body**:
    ```json
    {
      "email": "alice@example.com"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Password reset link sent (stub log generated in server console)."
    }
    ```

---

## 👤 User Profile Endpoints (Protected)
All endpoints below require a `Authorization: Bearer <token>` header.

### 1. Get Current User Profile
*   **Route**: `GET /api/users/me`
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "id": 1,
          "name": "Alice Smith",
          "email": "alice@example.com",
          "photo_url": "https://example.com/photo.jpg",
          "language": "en",
          "language_pref": "en",
          "role": "user"
        }
      }
    }
    ```

### 2. Update User Profile Settings
*   **Route**: `PUT /api/users/me`
*   **Request Body**:
    ```json
    {
      "name": "Alice J. Smith",
      "photo_url": "https://example.com/new-photo.jpg",
      "language_pref": "es"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Profile updated successfully.",
      "data": {
        "user": {
          "id": 1,
          "name": "Alice J. Smith",
          "email": "alice@example.com",
          "photo_url": "https://example.com/new-photo.jpg",
          "language": "es",
          "language_pref": "es",
          "role": "user"
        }
      }
    }
    ```

### 3. Delete Account
*   **Route**: `DELETE /api/users/me`
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "User account and all related data deleted successfully."
    }
    ```

### 4. Saved Destinations List
*   **Route**: `GET /api/users/me/saved-destinations`
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "name": "Paris",
          "country": "France",
          "lat": "48.85660000",
          "lng": "2.35220000",
          "region": "Europe",
          "image_url": "https://images.unsplash.com/...w=400",
          "cost_index": 3,
          "popularity": 5
        }
      ]
    }
    ```

---

## ✈️ Trip CRUD Endpoints (Protected)
All endpoints require a `Authorization: Bearer <token>` header.

### 1. Create Trip
*   **Route**: `POST /api/trips`
*   **Request Body**:
    ```json
    {
      "name": "Summer Europe Trip",
      "start_date": "2026-07-01",
      "end_date": "2026-07-15",
      "description": "Exploring France and Italy",
      "cover_photo_url": "https://images.unsplash.com/...w=800"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Trip created successfully.",
      "data": {
        "trip": {
          "id": 101,
          "name": "Summer Europe Trip",
          "start_date": "2026-07-01",
          "end_date": "2026-07-15",
          "description": "Exploring France and Italy",
          "cover_photo_url": "https://images.unsplash.com/...w=800",
          "is_public": false,
          "share_slug": null
        }
      }
    }
    ```

### 2. List All User Trips
*   **Route**: `GET /api/trips`
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 101,
          "name": "Summer Europe Trip",
          "start_date": "2026-07-01",
          "end_date": "2026-07-15",
          "description": "Exploring France and Italy",
          "cover_photo_url": "https://images.unsplash.com/...w=800",
          "is_public": false,
          "share_slug": null,
          "destination_count": 0
        }
      ]
    }
    ```

### 3. Get Nested Trip Details (Itinerary View)
*   **Route**: `GET /api/trips/:id`
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "trip": {
          "id": 101,
          "user_id": 1,
          "name": "Summer Europe Trip",
          "start_date": "2026-07-01",
          "end_date": "2026-07-15",
          "description": "Exploring France and Italy",
          "cover_photo_url": "https://images.unsplash.com/...w=800",
          "is_public": false,
          "share_slug": null,
          "share_token": null
        },
        "stops": [
          {
            "id": 5,
            "trip_id": 101,
            "city_id": 1,
            "order_index": 0,
            "start_date": "2026-07-01",
            "end_date": "2026-07-05",
            "cityName": "Paris",
            "country": "France",
            "lat": "48.85660000",
            "lng": "2.35220000",
            "image_url": "https://images.unsplash.com/...w=400",
            "region": "Europe",
            "cost_index": 3,
            "popularity": 5,
            "activities": [
              {
                "id": 12,
                "stop_id": 5,
                "activity_id": 1,
                "day_number": 1,
                "time_slot": "morning",
                "cost": "45.00",
                "name": "Eiffel Tower Summit Tour",
                "category": "sightseeing",
                "description": "Guided access to the top...",
                "image_url": "https://images.unsplash.com/...",
                "est_cost": "45.00",
                "est_duration_mins": 120
              }
            ]
          }
        ],
        "budget": {
          "id": 1,
          "trip_id": 101,
          "transport_cost": "0.00",
          "stay_cost": "0.00",
          "activities_cost": "0.00",
          "meals_cost": "0.00",
          "currency": "USD"
        }
      }
    }
    ```

### 4. Edit Trip
*   **Route**: `PUT /api/trips/:id`
*   **Request Body**:
    ```json
    {
      "name": "Updated Trip Name",
      "is_public": true,
      "share_slug": "paris-trip-2026"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Trip updated successfully.",
      "data": {
        "trip": {
          "id": 101,
          "name": "Updated Trip Name",
          "start_date": "2026-07-01",
          "end_date": "2026-07-15",
          "description": "Exploring France and Italy",
          "cover_photo_url": "https://images.unsplash.com/...w=800",
          "is_public": true,
          "share_slug": "paris-trip-2026"
        }
      }
    }
    ```

### 5. Delete Trip
*   **Route**: `DELETE /api/trips/:id`
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Trip 101 deleted successfully."
    }
    ```
