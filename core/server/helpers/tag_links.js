// # Tags Helper
// Usage: `{{tag_links}}`
//
// Returns a string of the tags on the post.
// By default, tags are separated by commas.

var hbs    = require('express-hbs'),
    _      = require('lodash'),
    config = require('../config'),
    utils  = require('./utils'),
    api    = require('../api'),
    tag_links;

tag_links = function(options) {
  var tagIds = _.map(this.tags, 'id'),
      // 全件表示するかどうか
      all = options.hash && options.hash.all ? options.hash.all : false;
  var query = {
    context: { internal: false },
    limit: 'all',
    include: 'count.posts',
    order: 'count.posts desc'
  };
  if (!all && !_.isEmpty(tagIds)) {
    query.filter = tagIds.map(function(id) { return 'id:' + id }).join(',');
  }
  return api.tags.browse(query).then(function(res) {
    if (!all && _.isEmpty(tagIds)) {
      return new hbs.handlebars.SafeString('');
    }
    var joined = res.tags.map(function(tag) {
      return utils.tagLinkTemplate({
        url: config.urlFor('tag', { tag: tag }),
        name: _.escape(tag.name),
        count_posts: tag.count.posts
      });
    }).join('');
    return new hbs.handlebars.SafeString(joined);
  });
};

module.exports = tag_links;
