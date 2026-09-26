import mongoose from "mongoose";

/**
 * One row per admin action: who did what to which record, why, and what it
 * looked like before and after. Kept without a TTL - it is the answer to
 * "who suspended this restaurant and when".
 */
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, enum: ["restaurant", "courier", "user", "order"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, maxlength: 500, default: "" },
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    requestId: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
