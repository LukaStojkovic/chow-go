import dotenv from "dotenv";

dotenv.config();

export async function getLocation(req, res) {
  const { lat, lon } = req.query;

  const data = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
  );

  return res.status(200).json(await data.json());
}
