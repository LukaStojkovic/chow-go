export function extractCloudinaryPublicId(url) {
  if (!url || !url.includes("res.cloudinary.com")) return null;

  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return null;

  let publicIdPart = url.substring(uploadIndex + 8);

  const versionMatch = publicIdPart.match(/^v\d+\//);
  if (versionMatch) {
    publicIdPart = publicIdPart.substring(versionMatch[0].length);
  }

  publicIdPart = publicIdPart.replace(/\.[^.]+$/, "");

  publicIdPart = publicIdPart.split("?")[0];

  return publicIdPart;
}
