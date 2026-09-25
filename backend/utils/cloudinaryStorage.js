// A multer storage engine that streams straight to Cloudinary. It replaces
// multer-storage-cloudinary, which is unmaintained and pins cloudinary 1.x
// (GHSA-g4mf-96x5-5m2c). It returns the same shape that package did: `path` is
// the secure URL stored on documents, `filename` the public id used to remove
// the file if multer aborts the request partway.
export function cloudinaryStorage({ cloudinary, folder, allowedFormats }) {
  return {
    _handleFile(_req, file, callback) {
      const upload = cloudinary.uploader.upload_stream(
        { folder, allowed_formats: allowedFormats, resource_type: "image" },
        (error, result) => {
          if (error) return callback(error);
          callback(null, {
            path: result.secure_url,
            size: result.bytes,
            filename: result.public_id,
          });
        },
      );
      file.stream.on("error", (error) => upload.destroy?.(error));
      file.stream.pipe(upload);
    },

    _removeFile(_req, file, callback) {
      if (!file.filename) return callback(null);
      cloudinary.uploader.destroy(file.filename, { invalidate: true }, (error) => callback(error ?? null));
    },
  };
}
