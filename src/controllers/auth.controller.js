import * as authService from '../services/auth.service.js';

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register(email, password, name);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function rotateKey(req, res, next) {
  try {
    const result = await authService.rotateApiKey(req.user._id);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
