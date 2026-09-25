// A substring check let "https://evil.tld/?res.cloudinary.com/x/upload/foo"
// resolve to the public id "foo" in this account. Only a URL whose host is
// Cloudinary and whose first path segment is this account's cloud qualifies.
export function isOwnCloudinaryUrl(url) {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      parsed.hostname === "res.cloudinary.com" &&
      parsed.pathname.split("/")[1] === process.env.CLOUDINARY_CLOUD_NAME
    );
  } catch {
    return false;
  }
}

export function extractCloudinaryPublicId(url) {
  if (!isOwnCloudinaryUrl(url)) return null;

  const { pathname } = new URL(url);
  const uploadIndex = pathname.indexOf("/upload/");
  if (uploadIndex === -1) return null;

  let publicIdPart = decodeURIComponent(pathname.substring(uploadIndex + 8));

  const versionMatch = publicIdPart.match(/^v\d+\//);
  if (versionMatch) {
    publicIdPart = publicIdPart.substring(versionMatch[0].length);
  }

  publicIdPart = publicIdPart.replace(/\.[^./]+$/, "");

  return publicIdPart || null;
}
