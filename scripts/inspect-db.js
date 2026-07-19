import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/user.model.js';
import Endpoint from '../src/models/endpoint.model.js';
import Event from '../src/models/event.model.js';
import Delivery from '../src/models/delivery.model.js';

dotenv.config();

if (!process.env.MONGO_URI) {
  process.stderr.write('MONGO_URI is required — set it in .env\n');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.countDocuments();
  const endpoints = await Endpoint.countDocuments();
  const events = await Event.countDocuments();
  const totalDeliveries = await Delivery.countDocuments();
  const deliveriesByStatus = await Delivery.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  console.log(JSON.stringify({
    users,
    endpoints,
    events,
    totalDeliveries,
    deliveriesByStatus: Object.fromEntries(
      deliveriesByStatus.map((entry) => [entry._id, entry.count]),
    ),
  }, null, 2));
} catch (err) {
  process.stderr.write(`${err.message}\n`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
