import { describe, expect, it } from "vitest";

import { cloudinarySrcSet, cloudinaryUrl } from "../src/image.js";

const UPLOAD = "https://res.cloudinary.com/demo/image/upload/v1/dishes/a.jpg";

describe("cloudinaryUrl", () => {
  it("inserts delivery transforms after /upload/", () => {
    expect(cloudinaryUrl(UPLOAD, { width: 300.4 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_300/v1/dishes/a.jpg",
    );
  });

  it("adds gravity for a fill crop", () => {
    expect(cloudinaryUrl(UPLOAD, { width: 100, height: 100, crop: "fill" })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,w_100,h_100,g_auto/v1/dishes/a.jpg",
    );
  });

  it("leaves other hosts and non-strings alone", () => {
    const google = "https://lh3.googleusercontent.com/a/photo.jpg";
    expect(cloudinaryUrl(google, { width: 100 })).toBe(google);
    expect(cloudinaryUrl(null)).toBeNull();
    expect(cloudinaryUrl(undefined)).toBeUndefined();
  });
});

describe("cloudinarySrcSet", () => {
  it("builds 1x and 2x candidates", () => {
    expect(cloudinarySrcSet(UPLOAD, 300)).toBe(
      `${cloudinaryUrl(UPLOAD, { width: 300 })} 300w, ${cloudinaryUrl(UPLOAD, { width: 600 })} 600w`,
    );
  });

  it("is undefined for URLs it cannot resize", () => {
    expect(cloudinarySrcSet("https://example.com/a.jpg", 300)).toBeUndefined();
    expect(cloudinarySrcSet(null, 300)).toBeUndefined();
  });
});
