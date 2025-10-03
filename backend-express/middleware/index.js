const { auth, optionalAuth } = require('./auth');
const { validate, schemas } = require('./validation');
const { errorHandler, notFound } = require('./error');

module.exports = {
  auth,
  optionalAuth,
  validate,
  schemas,
  errorHandler,
  notFound
};