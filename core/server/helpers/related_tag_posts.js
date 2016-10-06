// # Tags Helper
// Usage: `{{popular_posts}}`
//
// Returns a string of the tags on the post.
// By default, tags are separated by commas.

var hbs         = require('express-hbs'),
    _           = require('lodash'),
    config = require('../config'),
    utils       = require('./utils'),
    api         = require('../api'),
    MongoClient = require('mongodb').MongoClient,
    assert      = require('assert'),
    db,
    col,
    related_tag_posts;

const MONGO_URL = 'mongodb://localhost:27017/maytry_analytics';
const DEFAULT_MAX = 5;
const DEFAULT_PERIOD = 'week';
const DEFAULT_IMAGE = '/content/images/2016/05/title_logo.png';

MongoClient.connect(MONGO_URL, function(err, _db) {
  assert.equal(null, err);
  col = _db.collection('access_ranking');
  db = _db;
});

// TODO:人気順
related_tag_posts = function(options) {
  var contentInfos = [],
      max = options.hash && options.hash.max ? options.hash.max : DEFAULT_MAX,
      period = options.hash && options.hash.period ? options.hash.period : DEFAULT_PERIOD,
      all = options.hash && options.hash.all ? options.hash.all : false,
      mode = options.hash && options.hash.mode ? options.hash.mode : 0,
      tagIds = _.map(this.tags, 'id'),
      tags = null;
  
  var query = {
    context: { internal: false },
    limit: 'all',
    include: 'count.posts',
    order: 'count.posts desc'
  };
  if(!all && !_.isEmpty(tagIds)) {
    query.filter = tagIds.map(function(id) { return 'id:' + id }).join(',');
  }
  return api.tags.browse(query).then(function(res) {
    if(!all && _.isEmpty(tagIds)) {
      return new hbs.handlebars.SafeString("");
    }
    // 記事に関連するタグのみ選出
    var count = 0;
    var tags = res.tags.filter(function(tag) {
      if (extraMax <= count) return false;
      count += tag.count.posts;
      return true;
    });
    return api.posts.browse({
      context: { internal: false },
      limit: String(max),
      filter: tags.map(function(tag) { return 'tags.id:' + tag.id }).join(',')
    });
  }).then(function(res) {
    if (null == res.posts || res.posts.length === 0) {
      return new hbs.handlebars.SafeString("");
    }
    
    var posts = res.posts.filter(function(post) {
      return self.id !== post.id
    }).slice(0, Math.min(max, res.posts.length - 1));
    
    if (null == posts || posts.length === 0) {
      return new hbs.handlebars.SafeString("");
    }
    
    var joined = "<div class='related-tag-posts simple-" + (mode !== 0 ? "image-" : "") + "posts'>" +
        _.map(posts, function(post) {
          switch(mode) {
            case 1:
              return utils.simpleImagePostTemplate({
                url: '/' + post.slug + '/',
                imagePath: post.image || DEFAULT_IMAGE,
                text: _.escape(post.title)
              });
            default:
              return utils.simplePostTemplate({
                url: '/' + post.slug + '/',
                text: _.escape(post.title)
              });
          }
        }).join("") + "</div>";
    return new hbs.handlebars.SafeString(joined);
  });
};

module.exports = related_tag_posts;
