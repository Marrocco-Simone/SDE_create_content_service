function pageNotFound(req, res, next) {
  res.status(404).send({ error: "Page not found" });
}

module.exports = { pageNotFound };
