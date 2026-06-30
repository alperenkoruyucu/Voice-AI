const { z } = require('zod');

const createCustomerSchema = z.object({
  phoneNumber: z.string({ required_error: "phoneNumber is strictly required." })
    .regex(/^\+90[0-9]{10}$/, { message: "Phone number must strictly follow +90XXXXXXXXXX format (13 chars total)." }),
  
  name: z.string().min(2, "Name must be at least 2 chars.").max(50, "Name too long.").optional(),
  
  email: z.string().email("Invalid email format.").optional(),
  
  street: z.string({ required_error: "street is required for default address." })
    .min(5, "Street must be at least 5 chars.")
    .max(200, "Street address cannot exceed 200 chars."),
    
  city: z.string().max(50).optional()
});

module.exports = { createCustomerSchema };