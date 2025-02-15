import { RegisterRequest } from "../../src/types/auth";
import { BACKEND_URL } from "../config/constants";
import { expect } from "@playwright/test";

export const registerUser = async (user: RegisterRequest) => {
  const response = await fetch(`${BACKEND_URL}/users/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });

  expect(response.status).toBe(201);
};
