import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
  {
    n: { type: Number, required: true },
    at: { type: Date, required: true },
    httpStatus: { type: Number },
    error: { type: String },
    durationMs: { type: Number },
  },
  { _id: false },
);

const deliverySchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    endpoint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Endpoint',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'dead'],
      default: 'pending',
      index: true,
    },
    attempts: {
      type: [attemptSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model('Delivery', deliverySchema);
