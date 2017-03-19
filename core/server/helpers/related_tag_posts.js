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
    db,
    col,
    related_tag_posts;

const MONGO_URL = 'mongodb://localhost:27017/maytry_analytics';
const DEFAULT_MAX = 5;
const DEFAULT_IMAGE = '/assets/images/title_logo.png';

MongoClient.connect(MONGO_URL, function(err, _db) {
  col = _db.collection('access_ranking');
  db = _db;
});

// TODO:人気順
related_tag_posts = function(options) {
  var max = options.hash && options.hash.max ? options.hash.max : DEFAULT_MAX,
      all = options.hash && options.hash.all ? options.hash.all : false,
      mode = options.hash && options.hash.mode ? options.hash.mode : 0,
      tagIds = _.map(this.tags, 'id'),
      tags = null,
      self = this;
  
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
    if (_.isEmpty(res.tags)) {
      reject();
    }
    // 記事に関連するタグのみ選出
    var count = 0;
    var tags = res.tags.filter(function(tag) {
      if (max <= count) return false;
      count += tag.count.posts;
      return true;
    });
    return api.posts.browse({
      context: { internal: false },
      limit: String(max + 1),
      filter: tags.map(function(tag) { return 'tags.id:' + tag.id }).join(',')
    });
  }).then(function(res) {
    if (_.isEmpty(res.posts)) {
      console.log('nothing related post.');
      return new hbs.handlebars.SafeString('');
    }

    var posts = res.posts.filter(function(post) {
      return self.id !== post.id
    }).slice(0, Math.min(max, res.posts.length - 1));
    
    if (_.isEmpty(posts)) {
      console.log('nothing related post.');
      return new hbs.handlebars.SafeString('');
    }
    
    var joined = _.map(posts, function(post) {
          switch(mode) {
            case 1:
              return utils.simpleImagePostTemplate({
                url: '/' + post.slug + '/',
                imagePath: post.image || DEFAULT_IMAGE,
                title: _.escape(post.title)
              });
            default:
              return utils.simplePostTemplate({
                url: '/' + post.slug + '/',
                title: _.escape(post.title)
              });
          }
        }).join('');
    return new hbs.handlebars.SafeString(joined);
  }, function(err) {
    console.log(err);
    return new hbs.handlebars.SafeString('');
  });
};

module.exports = related_tag_posts;
