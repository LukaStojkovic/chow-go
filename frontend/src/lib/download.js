export function filenameFromDisposition(header, fallback) {
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header || "");
  return match ? decodeURIComponent(match[1]) : fallback;
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function readBlobText(blob) {
  if (typeof blob.text === "function") return blob.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

export async function withJsonErrorBody(error) {
  const data = error?.response?.data;
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await readBlobText(data));
    } catch {
      error.response.data = {};
    }
  }
  return error;
}
