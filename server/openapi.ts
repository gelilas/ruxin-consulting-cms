export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Ruxin Consulting CMS API',
    version: '1.0.0',
    description:
      'SQL-backed CMS API. Authenticate with **POST /api/login**, copy the `token`, then click **Authorize** and paste it as a Bearer JWT.',
  },
  servers: [{ url: 'http://localhost:4001', description: 'Local API' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Content' },
    { name: 'Analytics' },
    { name: 'Users' },
    { name: 'Pages' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT from POST /api/login (`token` field)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
        required: ['error'],
      },
      PublicUser: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'EDITOR'] },
        },
        required: ['id', 'email', 'name', 'role'],
      },
      UserRow: {
        allOf: [
          { $ref: '#/components/schemas/PublicUser' },
          {
            type: 'object',
            properties: {
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      Page: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          slug: { type: 'string', example: 'about-team' },
          title: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published'] },
          body: { type: 'object', additionalProperties: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          createdById: { type: 'string', nullable: true },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@ruxin.local' },
          password: { type: 'string', format: 'password', example: 'change-me-now' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          token: { type: 'string', description: 'JWT access token' },
          tokenType: { type: 'string', example: 'Bearer' },
          user: { $ref: '#/components/schemas/PublicUser' },
        },
      },
      CreateUserRequest: {
        type: 'object',
        required: ['email', 'name', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          password: { type: 'string', minLength: 10 },
          role: { type: 'string', enum: ['ADMIN', 'EDITOR'] },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'EDITOR'] },
          password: { type: 'string', minLength: 10 },
          currentPassword: {
            type: 'string',
            description: 'Required when changing your own password',
          },
        },
      },
      CreatePageRequest: {
        type: 'object',
        required: ['slug', 'title'],
        properties: {
          slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', example: 'insights-q1' },
          title: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published'], default: 'draft' },
          body: { type: 'object', additionalProperties: true },
        },
      },
      UpdatePageRequest: {
        type: 'object',
        properties: {
          slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
          title: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published'] },
          body: { type: 'object', additionalProperties: true },
        },
      },
      SiteContent: {
        type: 'object',
        description: 'Full marketing site JSON (SiteContent shape)',
        additionalProperties: true,
      },
      AnalyticsEvent: {
        type: 'object',
        required: ['name', 'path'],
        properties: {
          name: { type: 'string', example: 'service_viewed' },
          path: { type: 'string', example: '/' },
          section: { type: 'string', nullable: true },
          service: { type: 'string', nullable: true },
          visitorId: { type: 'string', nullable: true, description: 'Anonymous browser identifier; the API stores only a hash.' },
          referrer: { type: 'string', nullable: true },
          value: { type: 'integer', nullable: true, description: 'Optional duration in seconds for engagement events.' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'API is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { ok: { type: 'boolean', example: true } },
                },
              },
            },
          },
        },
      },
    },
    '/api/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login (returns JWT)',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '429': { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout (client should discard JWT)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
              },
            },
          },
        },
      },
    },
    '/api/session': {
      get: {
        tags: ['Auth'],
        summary: 'Validate JWT and return current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Valid session',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/PublicUser' },
                  },
                },
              },
            },
          },
          '401': { description: 'Missing or invalid JWT' },
        },
      },
    },
    '/api/analytics/events': {
      post: {
        tags: ['Analytics'],
        summary: 'Record an anonymous website event',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AnalyticsEvent' } } },
        },
        responses: {
          '200': { description: 'Recorded' },
          '400': { description: 'Invalid event' },
          '429': { description: 'Rate limited' },
        },
      },
    },
    '/api/analytics/summary': {
      get: {
        tags: ['Analytics'],
        summary: 'Get an aggregated analytics summary',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'from', in: 'query', required: false, schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', required: false, schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Aggregated analytics summary' },
          '400': { description: 'Invalid date range' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/content': {
      get: {
        tags: ['Content'],
        summary: 'Get public site content',
        responses: {
          '200': {
            description: 'Site content JSON',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SiteContent' } } },
          },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Content'],
        summary: 'Replace full site content',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SiteContent' } } },
        },
        responses: {
          '200': {
            description: 'Saved',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
              },
            },
          },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/content/{section}': {
      patch: {
        tags: ['Content'],
        summary: 'Patch one content section',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'section',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: [
                'company',
                'navLinks',
                'hero',
                'about',
                'services',
                'clients',
                'testimonials',
                'whyChoose',
                'investmentIntelligence',
                'team',
                'careers',
                'insightCategories',
                'insights',
                'assistant',
              ],
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '400': { description: 'Invalid section or payload' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Content not found' },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (ADMIN)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: { type: 'array', items: { $ref: '#/components/schemas/UserRow' } },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Admin only' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create user (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/UserRow' } },
                },
              },
            },
          },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Admin only' },
          '409': { description: 'Email already exists' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by id (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'User',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/UserRow' } },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Admin only' },
          '404': { description: 'Not found' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateUserRequest' } },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Admin only' },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted' },
          '400': { description: 'Cannot delete yourself' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Admin only' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/api/pages': {
      get: {
        tags: ['Pages'],
        summary: 'List pages',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Pages',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    pages: { type: 'array', items: { $ref: '#/components/schemas/Page' } },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Pages'],
        summary: 'Create page',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreatePageRequest' } },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '409': { description: 'Slug already exists' },
        },
      },
    },
    '/api/pages/{idOrSlug}': {
      get: {
        tags: ['Pages'],
        summary: 'Get page by slug (public if published)',
        description: 'Path param is the page **slug**. Draft pages require a valid JWT.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'idOrSlug',
            in: 'path',
            required: true,
            description: 'Page slug',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Page',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Page' } } },
          },
          '404': { description: 'Not found or draft without auth' },
        },
      },
      put: {
        tags: ['Pages'],
        summary: 'Update page by id',
        description: 'Path param is the page **id** (cuid), not the slug.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'idOrSlug',
            in: 'path',
            required: true,
            description: 'Page id',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdatePageRequest' } },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Not found' },
          '409': { description: 'Slug clash' },
        },
      },
      delete: {
        tags: ['Pages'],
        summary: 'Delete page by id',
        description: 'Path param is the page **id** (cuid), not the slug.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'idOrSlug',
            in: 'path',
            required: true,
            description: 'Page id',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Deleted' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Not found' },
        },
      },
    },
  },
} as const
