// @ts-nocheck
export {};
const logger = require('../utils/logger');
const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  logger.error(`[API Error] ${req.method} ${req.url} -`, err.message);

  // 1. Handle Prisma Database Errors automatically
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ 
        success: false, 
        error: 'A record with this value already exists.' 
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'The requested database record was not found.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      error: 'Database operation failed.',
      // Only show the raw database error if we are not in production
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }

  // 2. Handle Zod Validation Errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid input data provided.',
      issues: err.errors.map(e => ({ 
        field: e.path.join('.').replace('body.', ''), // clean up the field name
        message: e.message 
      }))
    });
  }

  // 3. Default Fallback for all other errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    // Provide stack traces in development to help you debug easily
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
};

module.exports = errorHandler;



