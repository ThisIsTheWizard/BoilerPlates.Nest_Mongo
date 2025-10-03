#!/bin/bash

# Set the base URL for the API
BASE_URL="http://localhost:8000"

# Create temporary files to store the tokens
TOKEN_FILE=$(mktemp)
REFRESH_TOKEN_FILE=$(mktemp)
NEW_TOKEN_FILE=$(mktemp)

MONGO_CONTAINER=${MONGO_CONTAINER:-mongo_container}
MONGO_USER=${MONGO_USER:-mongo_user}
MONGO_PASSWORD=${MONGO_PASSWORD:-mongo_password}
MONGO_DB=${MONGO_DB:-nest_boiler}
MONGO_AUTH_DB=${MONGO_AUTH_DB:-admin}

# Reset the database
echo "Resetting the database..."
docker exec -i node_server_container pnpx prisma db push --force-reset

# Seed the database
echo "Seeding the database..."
docker exec -i node_server_container pnpx prisma db seed

# Register a new user
echo "Registering a new user..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "password": "Password123!", "first_name": "Test", "last_name": "User" }' \
  "$BASE_URL/auth/register"

# Wait for the database to update
sleep 2

# Get the verification token from the database
echo "Getting verification token..."
VERIFICATION_TOKEN=$(docker exec -i "$MONGO_CONTAINER" mongosh --quiet -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase "$MONGO_AUTH_DB" --eval "db.getSiblingDB('$MONGO_DB').verification_tokens.findOne({ email: 'test@example.com', type: 'user_verification', status: 'unverified' }, { token: 1 }).token" | tr -d '[:space:]')

# Verify the user
echo "Verifying the user..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "token": "'$VERIFICATION_TOKEN'" }' \
  "$BASE_URL/auth/verify-user-email"

# Log in with the new user and store the auth token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "password": "Password123!" }' \
  "$BASE_URL/auth/login")

echo "$LOGIN_RESPONSE" | jq -r '.access_token' > "$TOKEN_FILE"
echo "$LOGIN_RESPONSE" | jq -r '.refresh_token' > "$REFRESH_TOKEN_FILE"

# Get the auth token from the temporary file
TOKEN=$(cat "$TOKEN_FILE")
REFRESH_TOKEN=$(cat "$REFRESH_TOKEN_FILE")

# Refresh the token
echo "Refreshing the token..."
REFRESH_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{ "access_token": "'$TOKEN'", "refresh_token": "'$REFRESH_TOKEN'" }' \
  "$BASE_URL/auth/refresh-token")
echo "Refresh response: $REFRESH_RESPONSE"

echo "$REFRESH_RESPONSE" | jq -r '.access_token' > "$NEW_TOKEN_FILE"
NEW_TOKEN=$(cat "$NEW_TOKEN_FILE")

# Get the user's information
echo "Getting user information..."
curl -X GET \
  -H "Authorization: Bearer $NEW_TOKEN" \
  "$BASE_URL/auth/user"

# Forgot password flow
echo "Forgot password flow..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com" }' \
  "$BASE_URL/auth/forgot-password"

sleep 2

FORGOT_PASSWORD_TOKEN=$(docker exec -i "$MONGO_CONTAINER" mongosh --quiet -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase "$MONGO_AUTH_DB" --eval "db.getSiblingDB('$MONGO_DB').verification_tokens.findOne({ email: 'test@example.com', type: 'forgot_password', status: 'unverified' }, { token: 1 }).token" | tr -d '[:space:]')

curl -X POST \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "token": "'$FORGOT_PASSWORD_TOKEN'" }' \
  "$BASE_URL/auth/verify-forgot-password-code"

curl -X POST \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "token": "'$FORGOT_PASSWORD_TOKEN'", "password": "Password789!" }' \
  "$BASE_URL/auth/verify-forgot-password"

# Create a new user
echo "Creating a new user..."
USER_ID=$(curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -d '{ "email": "test2@example.com", "password": "Password123!", "first_name": "Test2", "last_name": "User2" }' \
  "$BASE_URL/users" | jq -r '.id')

# Get all users
echo "Getting all users..."
curl -X GET \
  -H "Authorization: Bearer $NEW_TOKEN" \
  "$BASE_URL/users"

# Get a user by ID
echo "Getting a user by ID..."
curl -X GET \
  -H "Authorization: Bearer $NEW_TOKEN" \
  "$BASE_URL/users/$USER_ID"

# Update a user
echo "Updating a user..."
curl -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -d '{ "first_name": "Updated" }' \
  "$BASE_URL/users/$USER_ID"

# Get the role ID
echo "Getting the role ID..."
ROLE_ID=$(curl -X GET \
  -H "Authorization: Bearer $NEW_TOKEN" \
  "$BASE_URL/roles" | jq -r '.[0].id')

# Assign a role to a user
echo "Assigning a role to a user..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -d '{ "user_id": "'$USER_ID'", "role_id": "'$ROLE_ID'" }' \
  "$BASE_URL/auth/assign-role"

# Revoke a role from a user
echo "Revoking a role from a user..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -d '{ "user_id": "'$USER_ID'", "role_id": "'$ROLE_ID'" }' \
  "$BASE_URL/auth/revoke-role"

# Forgot password flow
echo "Forgot password flow..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com" }' \
  "$BASE_URL/auth/forgot-password"

sleep 2

FORGOT_PASSWORD_TOKEN=$(docker exec -i "$MONGO_CONTAINER" mongosh --quiet -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase "$MONGO_AUTH_DB" --eval "db.getSiblingDB('$MONGO_DB').verification_tokens.findOne({ email: 'test@example.com', type: 'forgot_password', status: 'unverified' }, { token: 1 }).token" | tr -d '[:space:]')

curl -X POST \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "token": "'$FORGOT_PASSWORD_TOKEN'" }' \
  "$BASE_URL/auth/verify-forgot-password-code"

curl -X POST \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "token": "'$FORGOT_PASSWORD_TOKEN'", "password": "Password789!" }' \
  "$BASE_URL/auth/verify-forgot-password"

# Changing the password
echo "Changing the password..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -d '{ "old_password": "Password789!", "new_password": "Password456!" }' \
  "$BASE_URL/auth/change-password"

# Role CRUD
echo "Role CRUD..."
NEW_ROLE_ID=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -d '{ "name": "test_role_'"$(date +%s)"'" }' \
  "$BASE_URL/roles" | jq -r '.id')

curl -X GET \
  -H "Authorization: Bearer $NEW_TOKEN" \
  "$BASE_URL/roles"

curl -X GET \
  -H "Authorization: Bearer $NEW_TOKEN" \
  "$BASE_URL/roles/$NEW_ROLE_ID"

curl -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -d '{ "name": "developer_'"$(date +%s)"'" }' \
  "$BASE_URL/roles/$NEW_ROLE_ID"

# Permission management
echo "Permission management..."
PERMISSION_ID=$(curl -s -X GET \
  -H "Authorization: Bearer $NEW_TOKEN" \
  "$BASE_URL/permissions" | jq -r '.[0].id')

curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -d '{ "role_id": "'$NEW_ROLE_ID'", "permission_id": "'$PERMISSION_ID'", "can_do_the_action": true }' \
  "$BASE_URL/roles/permissions/assign"

curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -d '{ "role_id": "'$NEW_ROLE_ID'", "permission_id": "'$PERMISSION_ID'" }' \
  "$BASE_URL/roles/permissions/revoke"

curl -X DELETE \
  -H "Authorization: Bearer $NEW_TOKEN" \
  "$BASE_URL/roles/$NEW_ROLE_ID"

# Delete a user
echo "Deleting a user..."
curl -X DELETE \
  -H "Authorization: Bearer $NEW_TOKEN" \
  "$BASE_URL/users/$USER_ID"

# Logout the user
echo "Logging out the user..."
curl -X POST \
  -H "Authorization: Bearer $NEW_TOKEN" \
  "$BASE_URL/auth/logout"

# Clean up the temporary file
rm "$TOKEN_FILE"
rm "$REFRESH_TOKEN_FILE"
rm "$NEW_TOKEN_FILE"
