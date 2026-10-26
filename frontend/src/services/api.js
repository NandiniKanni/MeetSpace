// Talks to the Express backend (usercontroller.js).
//
// What the backend really does (verified in usercontroller.js):
//   POST <users path>/login     body: { username, password }
//        200 -> { token }       404 -> user not found
//        401 -> wrong password  400 -> missing fields
//   POST <users path>/register  body: { name, username, password }
//        201 -> { message: "User Registered" }
//        302 -> { message: "User already exists" }   (yes, 302 - that is what the backend sends)
//        200 -> { message: "Something went wrong ..." } (the catch block forgets to set a status)

import { API_URL, API_USERS_PATH } from '../config';

// A small Error type that also remembers the HTTP status.
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Sends a POST request with a JSON body and returns { status, data }.
async function postJson(path, body) {
  let response;
  try {
    response = await fetch(`${API_URL}${API_USERS_PATH}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (networkError) {
    // fetch() only throws when the request could not be made at all
    throw new ApiError(
      'Cannot reach the server. Make sure the backend is running and the URLs in your .env file are correct.',
      0
    );
  }

  let data = {};
  try {
    data = await response.json();
  } catch (notJson) {
    // The response had no JSON body. That is fine, we just keep an empty object.
  }
  return { status: response.status, data };
}

export async function loginUser(username, password) {
  const { status, data } = await postJson('/login', { username, password });

  if (status === 200 && data.token) {
    return { token: data.token };
  }
  if (status === 400) throw new ApiError('Please enter your username and password.', status);
  if (status === 401) throw new ApiError('Incorrect username or password.', status);
  if (status === 404 && data.message) {
    // The backend answers 404 with a JSON message when the user does not exist.
    throw new ApiError('No account was found with that username.', status);
  }
  if (status === 404 || status === 405) {
    // A 404 WITHOUT that JSON message means Express itself did not find the route.
    throw new ApiError('Login URL not found. Check VITE_API_USERS_PATH in your .env file.', status);
  }
  throw new ApiError(data.message || `Login failed (status ${status}).`, status);
}

export async function registerUser({ name, username, password }) {
  const { status, data } = await postJson('/register', { name, username, password });

  if (status === 201) return;
  if (status === 302 || status === 409) {
    throw new ApiError('That username is already taken. Try another one.', status);
  }
  if (status === 404 || status === 405) {
    throw new ApiError('Register URL not found. Check VITE_API_USERS_PATH in your .env file.', status);
  }
  throw new ApiError(data.message || `Registration failed (status ${status}).`, status);
}
