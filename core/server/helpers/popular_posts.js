// # Tags Helper
// Usage: `{{popular_posts}}`
//
// Returns a string of the tags on the post.
// By default, tags are separated by commas.

var hbs         = require('express-hbs'),
    _           = require('lodash'),
    utils       = require('./utils'),
    api         = require('../api'),
    MongoClient = require('mongodb').MongoClient,
    db,
    col,
    popular_posts;

const MONGO_URL = 'mongodb://localhost:27017/maytry_analytics';
const DEFAULT_MAX = 5;
const DEFAULT_PERIOD = 'week';
const DEFAULT_IMAGE = '/assets/images/title_logo.png';

MongoClient.connect(MONGO_URL, function(err, _db) {
  col = _db.collection('access_ranking');
  db = _db;
});

popular_posts = function(options) {
  var contentInfos,
      max = options.hash && options.hash.max ? options.hash.max : DEFAULT_MAX,
      period = options.hash && options.hash.period ? options.hash.period : DEFAULT_PERIOD,
      all = options.hash && options.hash.all ? options.hash.all : false,
      mode = options.hash && options.hash.mode ? options.hash.mode : 0,
      self = this;

  var cursor = col.find({'query.period': period});
  return cursor.next().then(function(res) {
    // no record
    if (_.isEmpty(res.rows)) {
      reject();
    }

    contentInfos = res.rows.filter(function(info) {
      return self.url !== info[0];
    }).slice(0, Math.min(max, res.rows.length - 1));
    
    return api.posts.browse({
      context: { internal: false },
      limit: 'all',
      filter: contentInfos.map(function(info) {
        return 'slug:' + info[0].substr(1, info[0].length - 2);
      }).join(','),
      fields: 'title,url' + (mode !== 0 ? ',image' : '')
    })
  }).then(function(res) {
    if (_.isEmpty(res.posts)) {
      console.log('nothing related post.');
      return new hbs.handlebars.SafeString('');
    }
    
    // 人気順に並び替え
    var posts = contentInfos.map(function(info) {
      return res.posts.filter(function(post) {
        return post.url === info[0];
      })[0];
    });

    if (_.isEmpty(posts)) {
      console.log('nothing related post.');
      return new hbs.handlebars.SafeString('');
    }
    
    var joined = _.map(posts, function(post, i) {
          switch(mode) {
            case 1:
              return utils.rankImagePostTemplate({
								rank: i + 1,
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
        }).join('');
    return new hbs.handlebars.SafeString(joined);
  }, function(err) {
    console.log(err);
    return new hbs.handlebars.SafeString('');
  });
};

module.exports = popular_posts;
