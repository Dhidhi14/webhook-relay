export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'WebhookRelay API',
    version: '1.0.0',
    description:
      'Reliable webhook delivery — producers POST events, WebhookRelay delivers signed payloads with retries and dead-letter handling.',
  },
  servers: [{ url: 'http://localhost:5000', description: 'Local development' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Error message' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', minLength: 8, example: 'Pass1234' },
          name: { type: 'string', example: 'Jane Doe' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: 'Pass1234' },
        },
      },
      CreateEndpointRequest: {
        type: 'object',
        required: ['url', 'eventTypes'],
        properties: {
          url: { type: 'string', format: 'uri', example: 'https://webhook.site/your-uuid' },
          eventTypes: {
            type: 'array',
            items: { type: 'string' },
            example: ['payment.success', 'user.created'],
          },
        },
      },
      UpdateEndpointRequest: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri', example: 'https://webhook.site/new-uuid' },
          eventTypes: {
            type: 'array',
            items: { type: 'string' },
            example: ['payment.success'],
          },
          isActive: { type: 'boolean', example: true },
        },
      },
      CreateEventRequest: {
        type: 'object',
        required: ['type', 'payload', 'idempotencyKey'],
        properties: {
          type: { type: 'string', example: 'payment.success' },
          payload: { type: 'object', example: { orderId: '123', amount: 499 } },
          idempotencyKey: { type: 'string', example: 'evt-001' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: { status: 'ok', uptime: 123.45 },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } },
          },
        },
        responses: {
          201: {
            description: 'User created — apiKey shown once',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    user: { email: 'user@example.com', name: 'Jane Doe' },
                    token: 'eyJhbG...',
                    apiKey: 'whr_abc123...',
                  },
                },
              },
            },
          },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    user: { email: 'user@example.com', name: 'Jane Doe' },
                    token: 'eyJhbG...',
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials' },
          429: { description: 'Rate limit exceeded' },
        },
      },
    },
    '/api/auth/rotate-key': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate API key',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'New apiKey shown once',
            content: {
              'application/json': {
                example: { success: true, data: { apiKey: 'whr_newkey...' } },
              },
            },
          },
          401: { description: 'Authentication required' },
        },
      },
    },
    '/api/endpoints': {
      post: {
        tags: ['Endpoints'],
        summary: 'Create webhook endpoint',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateEndpointRequest' } },
          },
        },
        responses: {
          201: {
            description: 'Endpoint created — HMAC secret shown once',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    url: 'https://webhook.site/your-uuid',
                    eventTypes: ['payment.success'],
                    secret: '64hexchars...',
                  },
                  message: 'Store this secret now - it will not be shown again',
                },
              },
            },
          },
        },
      },
      get: {
        tags: ['Endpoints'],
        summary: 'List endpoints',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Endpoint list (no secrets)',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [{ url: 'https://webhook.site/your-uuid', eventTypes: ['payment.success'] }],
                },
              },
            },
          },
        },
      },
    },
    '/api/endpoints/{id}': {
      get: {
        tags: ['Endpoints'],
        summary: 'Get endpoint by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Endpoint details (no secret)' },
          404: { description: 'Endpoint not found' },
        },
      },
      patch: {
        tags: ['Endpoints'],
        summary: 'Update endpoint',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateEndpointRequest' } },
          },
        },
        responses: {
          200: { description: 'Endpoint updated' },
          404: { description: 'Endpoint not found' },
        },
      },
      delete: {
        tags: ['Endpoints'],
        summary: 'Delete endpoint',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Endpoint deleted',
            content: {
              'application/json': {
                example: { success: true, data: { message: 'Endpoint deleted' } },
              },
            },
          },
          404: { description: 'Endpoint not found' },
        },
      },
    },
    '/api/events': {
      post: {
        tags: ['Events'],
        summary: 'Ingest event (fan-out to matching endpoints)',
        security: [{ apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateEventRequest' } },
          },
        },
        responses: {
          201: {
            description: 'Event ingested',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    event: { type: 'payment.success', idempotencyKey: 'evt-001' },
                    duplicate: false,
                    deliveriesCreated: 1,
                  },
                },
              },
            },
          },
          401: { description: 'Invalid API key' },
        },
      },
    },
    '/api/deliveries': {
      get: {
        tags: ['Deliveries'],
        summary: 'List deliveries (paginated, filterable)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'success', 'failed', 'dead'] } },
          { name: 'eventId', in: 'query', schema: { type: 'string' } },
          { name: 'endpointId', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: {
            description: 'Paginated delivery list',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: { items: [], page: 1, totalPages: 0, total: 0 },
                },
              },
            },
          },
        },
      },
    },
    '/api/deliveries/{id}': {
      get: {
        tags: ['Deliveries'],
        summary: 'Get delivery with attempt timeline',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Full delivery with attempts array' },
          404: { description: 'Delivery not found' },
        },
      },
    },
    '/api/deliveries/{id}/replay': {
      post: {
        tags: ['Deliveries'],
        summary: 'Replay a dead delivery',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Delivery re-enqueued (attempt history preserved)',
            content: {
              'application/json': {
                example: { success: true, data: { status: 'pending' } },
              },
            },
          },
          400: { description: 'Only dead deliveries can be replayed' },
          404: { description: 'Delivery not found' },
        },
      },
    },
    '/api/stats': {
      get: {
        tags: ['Stats'],
        summary: 'Delivery statistics for authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Aggregated delivery stats',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    total: 10,
                    success: 7,
                    failed: 1,
                    dead: 1,
                    pending: 1,
                    successRate: 70,
                    avgAttempts: 1.5,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
