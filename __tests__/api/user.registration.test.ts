import { createMocks } from "node-mocks-http";
import { login, register } from "../../server/controllers/users";

test("User Registration - Success", async () => {
  const { req, res } = createMocks({
    method: "POST",
  });

  req.body = {
    name: "Test",
    surname: "User",
    username: "test_user",
    email: "test_user@gmail.com",
    password: "12345678",
    passwordConfirm: "12345678",
  };

  await register(req, res);

  expect(res._getStatusCode()).toBe(201);
});

test("User Registration - Passwords mismatch", async () => {
  const { req, res } = createMocks({
    method: "POST",
  });

  req.body = {
    name: "Test",
    surname: "User",
    username: "test_user",
    email: "test_user@gmail.com",
    password: "12345678",
    passwordConfirm: "12345679",
  };

  await register(req, res);

  expect(res._getStatusCode()).toBe(400);
  expect(res._getJSONData()).toEqual({ message: "Passwords don't match" });
});

test("User Login - Success", async () => {
  const { req, res } = createMocks({
    method: "GET",
  });

  req.body = {
    username: "admin_user",
    password: "admin_user",
  };

  await login(req, res);

  expect(res._getStatusCode()).toBe(200);
});

test("User Login - Incorrect Password", async () => {
  const { req, res } = createMocks({
    method: "GET",
  });

  req.body = {
    username: "admin_user",
    password: "admin_user_2",
  };

  await login(req, res);

  expect(res._getStatusCode()).toBe(401);
});

test("User Login - Missing field", async () => {
  const { req, res } = createMocks({
    method: "GET",
  });

  req.body = {
    username: "admin_user",
  };

  await login(req, res);

  expect(res._getStatusCode()).toBe(400);
});
