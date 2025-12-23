# Webfeed Backend

A simple Express backend that proxies Reddit feeds and provides authentication.

## Setup

1.  **Install Dependencies**

    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file in the root directory with the following variables:

    ```env
    PORT=3000
    REDDIT_FEED_URL=https://www.reddit.com/.json?feed=...
    REDDIT_COOKIE=...
    ADMIN_USERNAME=admin
    ADMIN_PASSWORD=secretpassword
    JWT_SECRET=your_jwt_secret_key_here
    JWT_REFRESH_SECRET=your_refresh_secret_key_here
    FRONTEND_ORIGIN=http://localhost:5173
    # Optional overrides
    # ACCESS_TOKEN_EXPIRES_IN=24h
    # REFRESH_TOKEN_EXPIRES_IN=30d
    ```

## API Documentation

### 1. Login

Authenticate to receive a JSON Web Token (JWT).

- **URL:** `/login`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "username": "admin",
    "password": "secretpassword"
  }
  ```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Get Feed

Retrieve the Reddit feed. Requires authentication.

- **URL:** `/api/feed`
- **Method:** `GET`
- **Headers:**
  - `Authorization`: `Bearer <your_access_token>`
- **Query Parameters:**
  - `limit` (optional): Number of posts to retrieve (default: 10).
  - `after` (optional): Pagination token for the next page.

**Example Request:**

```bash
curl -H "Authorization: Bearer <your_token>" http://localhost:3000/api/feed
```

### 3. Refresh Access Token

Mint a new access token using the httpOnly refresh cookie.

- **URL:** `/refresh`
- **Method:** `POST`
- **Credentials:** required (cookie)

**Response:**

```json
{
  "accessToken": "..."
}
```

### 4. Logout

Clears the refresh cookie.

- **URL:** `/logout`
- **Method:** `POST`
