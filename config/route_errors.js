module.exports = function (app) {

  app.use(function (err, req, res, next) {
    var statusCode  = err.status || 500;
    var statusText  = '';
    var errorDetail = (process.env.NODE_ENV === 'production') ? 'Sorry about this error' : err.stack;

    switch (statusCode) {
      case 400:
        statusText = 'Bad Request';
        break;
      case 401:
        statusText = 'Unauthorized';
        break;
      case 403:
        statusText = 'Forbidden';
        break;
      case 404:
        statusText = 'Not Found';
        break;
      case 500:
        statusText = 'Internal Server Error';
        break;
    }

    res.status(statusCode);

    if (process.env.NODE_ENV !== 'production') {
      console.log(errorDetail);
    }

    var title = statusCode + ': ' + statusText;
    var error = errorDetail;
    var url   = req.url;

    if (req.accepts('html')) {
      res.render('errors/500', { title: title, error: error, url: url });
      return;
    }

    if (req.accepts('json')) {
      res.send({ title: title, error: error, url: url });
    }
  });

};
