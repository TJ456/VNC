const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Common validation schemas
const schemas = {
  blockIp: Joi.object({
    ip: Joi.string().ip().required(),
    reason: Joi.string().optional(),
    duration: Joi.number().integer().positive().optional()
  }),

  simulateAttack: Joi.object({
    attack_type: Joi.string().valid('brute_force', 'dos', 'malware_transfer', 'data_exfiltration').required(),
    target_ip: Joi.string().ip().optional(),
    intensity: Joi.string().valid('low', 'medium', 'high').optional()
  }),

  createSession: Joi.object({
    client_ip: Joi.string().ip().required(),
    server_ip: Joi.string().ip().required(),
    client_port: Joi.number().integer().min(1).max(65535).optional(),
    server_port: Joi.number().integer().min(1).max(65535).optional()
  })
};

module.exports = {
  validate,
  schemas
};