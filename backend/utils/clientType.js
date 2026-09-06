// Gated so the web SPA's XHR responses never carry a bearer credential.
export const isMobileClient = (req) =>
  req.get("X-Client") === "mobile" || req.query.client === "mobile";

export const withAuthToken = (req, body, token) =>
  isMobileClient(req) ? { ...body, token } : body;
