// # Tags Helper
// Usage: `{{newly_posts}}`
//
// Returns a string of the tags on the post.
// By default, tags are separated by commas.

var hbs = require('express-hbs'),
    _ = require('lodash'),
    utils = require('./utils'),
    api = require('../api'),
    new_posts;

const DEFAULT_MAX = 5;
const DEFAULT_IMAGE = '/content/images/2016/05/title_logo.png';

new_posts = function(options) {
  var max = options.hash && options.hash.max ? options.hash.max : DEFAULT_MAX,
      mode = options.hash && options.hash.mode ? options.hash.mode : 0,
      self = this;

  return api.posts.browse({
    context: { internal: false },
    limit: String(max + 1), // 自身を含む可能性があるため+1
    fields: 'id,title,url' + (mode !== 0 ? ',image' : '')
  }).then(function(res) {
    if (null == res.posts || res.posts.length === 0) {
      return new hbs.handlebars.SafeString("");
    }
    
    var posts = res.posts.filter(function(post) {
      return self.id !== post.id;
    }).slice(0, Math.min(max, res.posts.length - 1));

    if (null == posts || posts.length === 0) {
      return new hbs.handlebars.SafeString("");
    }
    
    var joined = "<div class='new-posts simple-" + (mode !== 0 ? "image-" : "") + "posts'>" +
        _.map(posts, function(post) {
          switch(mode) {
            case 1:
              return utils.simpleImagePostTemplate({
                url: post.url,
                imagePath: post.image || DEFAULT_IMAGE,
                title: _.escape(post.title)
              });
            default:
              return utils.simplePostTemplate({
                url: post.url,
                title: _.escape(post.title)
              });
          }
        }).join("") + "</div>";
    return new hbs.handlebars.SafeString(joined);
  });
};

module.exports = new_posts;
