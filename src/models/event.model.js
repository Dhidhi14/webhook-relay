import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

eventSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });

export default mongoose.model('Event', eventSchema);
