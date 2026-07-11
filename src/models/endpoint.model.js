import mongoose from 'mongoose';

const endpointSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    secret: {
      type: String,
      required: true,
      select: false,
    },
    eventTypes: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'eventTypes must contain at least one event type',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    consecutiveDeadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.secret;
        return ret;
      },
    },
  },
);

export default mongoose.model('Endpoint', endpointSchema);
