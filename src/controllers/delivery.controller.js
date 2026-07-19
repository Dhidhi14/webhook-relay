import * as deliveryQueryService from '../services/delivery-query.service.js';

export async function list(req, res, next) {
  try {
    const result = await deliveryQueryService.listDeliveries(req.user._id, {
      eventId: req.validatedQuery?.eventId ?? req.query.eventId,
      endpointId: req.validatedQuery?.endpointId ?? req.query.endpointId,
      status: req.validatedQuery?.status ?? req.query.status,
      page: req.validatedQuery?.page ?? req.query.page,
      limit: req.validatedQuery?.limit ?? req.query.limit,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function get(req, res, next) {
  try {
    const delivery = await deliveryQueryService.getDelivery(req.user._id, req.params.id);

    res.json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
}

export async function replay(req, res, next) {
  try {
    const delivery = await deliveryQueryService.replayDelivery(req.user._id, req.params.id);

    res.json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
}

export async function stats(req, res, next) {
  try {
    const result = await deliveryQueryService.getStats(req.user._id);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
