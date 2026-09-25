import mongoose from "mongoose";

// The jti is the _id: a secondary unique index builds in the background, and a
// replay that lands before it finishes would be accepted.
const consumedHandoffSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

const ConsumedHandoff = mongoose.model("ConsumedHandoff", consumedHandoffSchema);

export default ConsumedHandoff;
