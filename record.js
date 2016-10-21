'use strict';

var beautify = require('js-beautify').js_beautify,
  path = require('path'),
  fs = require('fs'),
  parser = require('./parser'),
  url = require('url');

var api_index = 0;

var record_data = function(req, serverResData) {
  api_index += 1
  var fileSavePath = path.resolve(parser.args.save),
    reqFile = path.join(fileSavePath, api_index + 'requestData.txt'),
    respFile = path.join(fileSavePath, api_index + 'responseData.txt'),
    reqData
  if (/http/.test(req.url)) {
    reqData = url.parse(req.url)
  } else {
    reqData = url.parse('https://' + req.headers.host + req.url)
  }

  fs.appendFile(reqFile, beautify(JSON.stringify(reqData), {
    indent_size: 4
  }), function(err, data) {
    if (err) {
      return console.error(err);
    }
  });

  fs.appendFile(respFile, beautify(unescape(serverResData.toString().replace(/\\u/g, '%u')), {
    indent_size: 4
  }), function(err, data) {
    if (err) {
      return console.error(err);
    }
  });
};

module.exports = record_data;
