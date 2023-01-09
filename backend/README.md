# User information "/auth/me"

Check whether the user is logged in and return its data:

- fullname
- email
- avatar
- role
- id

Method: **GET**

credentials: include

Example: `curl localhost:8000/auth/me -b cookie.txt`

## Response for user not logged in:
```json
{
  "isLoggedIn": false
}
```

## Response for user logged in:
```json
{
  "isLoggedIn": true,
  "session": {
    "fullname": "John Doe",
    "email": "johndoe@example.com",
    "avatar": "avatar.jpg",
    "role": "user/admin",
    "id": "44"
  }
}
```

# Login "/auth/login"

Validate user credentials and return it's data:

- fullname
- email
- avatar
- role
- id

Method: **POST**

credentials: include

## Body:
```json
{
  "email": "johndoe@example.com",
  "password": "qwerty"
}
```

Example: `curl localhost:8000/auth/login -H "Content-type:application/json" -b cookie.txt -c cookie.txt -d "{\"email\":\"johndoe@example.com\",\"password\":\"qwerty\"}"`

## Response for successful login:
```json
{
  "isLoggedIn": true,
  "session": {
    "fullname": "John Doe",
    "email": "johndoe@example.com",
    "avatar": "avatar.jpg",
    "role": "user/admin",
    "id": "44"
  }
}
```

Error responses:

- Email does not exist: "User unregistered"
- Stored password and submitted password don't match: "Invalid credentials"

# Signup "/auth/signup"

Register user if username is available and return it's data:

- fullname
- email
- avatar
- role
- id

Method: **POST**

credentials: include

## Body:
```json
{
  "fullname": "John Doe",
  "email": "johndoe@example.com",
  "avatar": "avatar.jpg",
  "password": "qwerty"
}
```

Example: `curl localhost:8000/auth/signup -H "Content-type:application/json" -b cookie.txt -c cookie.txt -d "{\"fullname\":\"John Doe\",\"email\":\"johndoe@example.com\",\"password\":\"qwerty\"}"`

Response for successful signup:
```json
{
  "isLoggedIn": true,
  "session": {
    "fullname": "John Doe",
    "email": "johndoe@example.com",
    "avatar": "avatar.jpg",
    "role": "user/admin",
    "id": "44"
  }
}
```

Error responses:
- Email already exists: "Email " + email + " already taken"

# Logout "/logout"

Remove session cookie

Method: **POST**

credentials: include

## body: empty

Example: `curl localhost:8000/auth/logout -b cookie.txt -c cookie.txt -X POST`

Response: 200 OK
