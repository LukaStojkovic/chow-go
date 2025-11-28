import dotenv from "dotenv";

dotenv.config();

export async function getLocation(req, res) {
  const { lat, lon } = req.query;

  const data = await fetch(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${process.env.REVERSE_GEOCODING_API_KEY}`
  );

  return res.status(200).json(await data.json());
}
