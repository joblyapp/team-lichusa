# User information "/auth/me"

Return user data

- fullname
- email
- avatar
- role
- id

Method: **GET**

Example: `curl localhost:8000/auth/me -H "Authorization: Bearer {JWT}"`

## Response
```json
{
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

Validate user credentials and return it's data and a JWT:

Method: **POST**

## Body:
```json
{
  "email": "johndoe@example.com",
  "password": "qwerty"
}
```

Example: `curl localhost:8000/auth/login -H "Content-type:application/json" -d "{\"email\":\"johndoe@example.com\",\"password\":\"qwerty\"}"`

## Response for successful login:
```json
{
  "session": {
    "fullname": "John Doe",
    "email": "johndoe@example.com",
    "avatar": "avatar.jpg",
    "role": "user/admin",
    "id": "44"
  },
  "jwt": "JSON web token"
}
```

Error responses:

- Email does not exist: "User unregistered"
- Stored password and submitted password don't match: "Invalid credentials"

# Signup "/auth/signup"

Register user if username is available and return it's data and a JWT:

Method: **POST**

## Body:
```json
{
  "fullname": "John Doe",
  "email": "johndoe@example.com",
  "avatar": "avatar.jpg",
  "password": "qwerty"
}
```

Example: `curl localhost:8000/auth/signup -H "Content-type:application/json" -d "{\"fullname\":\"John Doe\",\"email\":\"johndoe@example.com\",\"password\":\"qwerty\"}"`

Response for successful signup:
```json
{
  "session": {
    "fullname": "John Doe",
    "email": "johndoe@example.com",
    "avatar": "avatar.jpg",
    "role": "user/admin",
    "id": "44"
  },
  "jwt": "JSON web token"
}
```

Error responses:
- Email already exists: "Email " + email + " already taken"
