const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger Configuration Options
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BPL-LIEO Queuing System API',
      version: '1.0.0',
      description: 'Interactive API Documentation for the Queuing System Backend',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Tells Swagger to look for JSDoc comments inside these files to auto-generate the docs
  apis: ['./server/routes/*.js'], 
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
