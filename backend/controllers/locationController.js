import dotenv from "dotenv";

dotenv.config();

export async function getLocation(req, res) {
  const { lat, lon } = req.query;

  const data = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
  );

  return res.status(200).json(await data.json());
}

export async function locationPrediction(req, res) {
  const { query } = req.query;

  try {
    const data = await fetch(
      `https://api.locationiq.com/v1/autocomplete?key=${
        process.env.LOCATION_IQ_ACCESS_KEY
      }&q=${encodeURIComponent(query)}&limit=5&dedupe=1`
    );

    if (!query || query.trim() === "") {
      return res
        .status(400)
        .json({ status: "fail", message: "Location is required" });
    }

    return res.status(200).json(await data.json());
  } catch (error) {
    console.error("Error fetching location predictions:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
