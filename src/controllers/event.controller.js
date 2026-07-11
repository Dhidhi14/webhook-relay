import * as eventService from '../services/event.service.js';

export async function ingest(req, res, next) {
  try {
    const result = await eventService.ingestEvent(req.user._id, req.body);

    res.status(201).json({
      success: true,
      data: {
        event: result.event,
        duplicate: result.duplicate,
        deliveriesCreated: result.deliveriesCreated,
      },
    });
  } catch (err) {
    next(err);
  }
}
