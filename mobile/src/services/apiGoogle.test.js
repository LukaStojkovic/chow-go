import * as WebBrowser from "expo-web-browser";

import { api } from "@/api/client";
import { completeGoogleProfile, linkGoogle, signInWithGoogle } from "./apiGoogle";

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));
jest.mock("expo-auth-session", () => ({
  makeRedirectUri: jest.fn(({ scheme, path }) => `${scheme}://${path}`),
}));
jest.mock("expo-linking", () => ({
  parse: jest.fn((url) => ({ queryParams: Object.fromEntries(new URL(url.replace(/^[a-z-]+:\/\//, "https://x/")).searchParams) })),
}));

const browserReturns = (url) => WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: "success", url });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(api, "post");
});

describe("signInWithGoogle", () => {
  it("opens the backend's route with a PKCE challenge and exchanges the code with the verifier", async () => {
    browserReturns("chowgo://auth/google?code=handoff-1");
    api.post.mockResolvedValue({ data: { status: "authenticated", token: "jwt-g", user: { _id: "u1" } } });

    await expect(signInWithGoogle()).resolves.toEqual({ status: "authenticated", token: "jwt-g", user: { _id: "u1" } });

    const [url, redirect] = WebBrowser.openAuthSessionAsync.mock.calls[0];
    const challenge = new URL(url).searchParams.get("challenge");
    expect(url).toContain("/auth/google?client=mobile");
    expect(redirect).toBe(new URL(url).searchParams.get("redirect"));

    const [path, body] = api.post.mock.calls[0];
    expect(path).toBe("/auth/google/exchange");
    expect(body.code).toBe("handoff-1");
    expect(body.codeVerifier).toMatch(/^[0-9a-f]{64}$/);
    expect(challenge).toBe(`sha256(${body.codeVerifier})`);
  });

  it("returns a signup token for a new user", async () => {
    browserReturns("chowgo://auth/google?code=handoff-1");
    api.post.mockResolvedValue({ data: { status: "newUser", signupToken: "s1", profile: { email: "a@b.c" } } });
    await expect(signInWithGoogle()).resolves.toEqual({ status: "newUser", signupToken: "s1", profile: { email: "a@b.c" } });
  });

  it("handles cancellation and backend refusals without exchanging", async () => {
    WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: "cancel" });
    await expect(signInWithGoogle()).resolves.toEqual({ status: "cancelled" });

    browserReturns("chowgo://auth/google?error=account_exists");
    await expect(signInWithGoogle()).resolves.toEqual({ status: "failed", reason: "account_exists" });

    browserReturns("chowgo://auth/google");
    await expect(signInWithGoogle()).resolves.toEqual({ status: "failed" });
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe("linkGoogle", () => {
  it("trades the session for a ticket, then confirms the link code with the verifier", async () => {
    api.post.mockResolvedValueOnce({ data: { ticket: "t 1" } }).mockResolvedValueOnce({ data: {} });
    browserReturns("chowgo://auth/google?linkCode=lc-1");

    await expect(linkGoogle()).resolves.toEqual({ status: "linked" });

    const [, ticketBody] = api.post.mock.calls[0];
    const [confirmPath, confirmBody] = api.post.mock.calls[1];
    expect(ticketBody.challenge).toBe(`sha256(${confirmBody.codeVerifier})`);
    expect(WebBrowser.openAuthSessionAsync.mock.calls[0][0]).toContain("ticket=t%201");
    expect(confirmPath).toBe("/auth/google/link/confirm");
    expect(confirmBody.code).toBe("lc-1");
  });

  it("reports cancellation and link errors", async () => {
    api.post.mockResolvedValue({ data: { ticket: "t" } });
    WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: "dismiss" });
    await expect(linkGoogle()).resolves.toEqual({ status: "cancelled" });

    browserReturns("chowgo://auth/google?linkError=already_linked");
    await expect(linkGoogle()).resolves.toEqual({ status: "failed", reason: "already_linked" });

    browserReturns("chowgo://auth/google");
    await expect(linkGoogle()).resolves.toEqual({ status: "failed" });
  });
});

describe("completeGoogleProfile", () => {
  it("posts the signup token, role and fields", async () => {
    api.post.mockResolvedValue({ data: { _id: "u1" } });
    await completeGoogleProfile({ signupToken: "s1", role: "courier", vehicleType: "bike" });
    expect(api.post).toHaveBeenCalledWith("/auth/google/complete-profile", {
      signupToken: "s1",
      role: "courier",
      vehicleType: "bike",
    });
  });
});
