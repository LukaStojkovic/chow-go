import mongoose from "mongoose";

// Daily counts of searches that named something on the menu, per ~11 km area.
// Only catalog strings are stored (a restaurant, dish, cuisine or category
// name the search matched exactly), never free text a customer typed.
const searchTrendSchema = new mongoose.Schema(
  {
    area: { type: String, required: true },
    day: { type: Date, required: true },
    key: { type: String, required: true, maxlength: 80 },
    label: { type: String, required: true, maxlength: 80 },
    kind: { type: String, enum: ["restaurant", "dish", "cuisine", "category"], required: true },
    count: { type: Number, default: 0 },
  },
  { versionKey: false },
);

searchTrendSchema.index({ area: 1, day: 1, key: 1 }, { unique: true });
searchTrendSchema.index({ day: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const SearchTrend = mongoose.model("SearchTrend", searchTrendSchema);

export default SearchTrend;
