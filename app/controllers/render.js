var Posts     = require('../models/posts');


module.exports = {

  partial: function (req, res, next) {
    Posts.getAll(false, function (err, posts) {
      if(err || !posts) {
        return next(err);
      }

      return res.render(req.params.partial, posts);
    });
  }

};
