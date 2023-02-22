function requestLogger(req, res, next) {
  console.log(`requested ${req.method} ${req.url}`);
  next();
}

module.exports = { requestLogger };
