// @ts-nocheck
export {};
const { z } = require('zod');

const createTicketSchema = z.object({
  body: z.object({
    serviceId: z.number({
      required_error: 'serviceId is required',
      invalid_type_error: 'serviceId must be a number'
    }),
    createdByUserId: z.number().optional().nullable(),
    priorityType: z.enum(['REGULAR', 'PWD', 'SENIOR', 'PREGNANT', 'RETURNING']).optional()
  })
});

const callTicketSchema = z.object({
  body: z.object({
    counterId: z.number({ required_error: 'counterId is required' }),
    servedByUserId: z.number().optional()
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, "Ticket ID must be a numeric string")
  })
});

module.exports = {
  createTicketSchema,
  callTicketSchema
};


