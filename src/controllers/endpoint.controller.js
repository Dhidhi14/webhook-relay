import * as endpointService from '../services/endpoint.service.js';

export async function create(req, res, next) {
  try {
    const endpoint = await endpointService.createEndpoint(req.user._id, req.body);

    res.status(201).json({
      success: true,
      data: endpoint,
      message: 'Store this secret now - it will not be shown again',
    });
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const endpoints = await endpointService.listEndpoints(req.user._id);

    res.json({
      success: true,
      data: endpoints,
    });
  } catch (err) {
    next(err);
  }
}

export async function get(req, res, next) {
  try {
    const endpoint = await endpointService.getEndpoint(req.user._id, req.params.id);

    res.json({
      success: true,
      data: endpoint,
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const endpoint = await endpointService.updateEndpoint(req.user._id, req.params.id, req.body);

    res.json({
      success: true,
      data: endpoint,
    });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await endpointService.deleteEndpoint(req.user._id, req.params.id);

    res.json({
      success: true,
      data: { message: 'Endpoint deleted' },
    });
  } catch (err) {
    next(err);
  }
}
