import { expect, test } from "@playwright/test";
import { login } from "../login/login";

test("로그인 테스트", async ({ page }) => {
  const loginSuccess = await login(page);
  expect(loginSuccess).toBe(true);
});