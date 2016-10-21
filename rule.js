'use strict';

var tools = require('./tools'),
  record_data = require('./record'),
  gen = require('./gen'),
  parser = require('./parser'),
  rule = require('./rule');

var mock_rules = parser.parse()
var rule = {
  summary: function() {
    return 'mock server working...'
  },

  shouldInterceptHttpsReq: function(req) {
    // switch https on
    return true
  },

  replaceServerResDataAsync: function(req, res, serverResData, callback) {
    if (/json/i.test(res.headers['content-type']) && serverResData.toString() != '') {
      try {
        var mockResData = JSON.parse(serverResData.toString('utf-8')),
          global_mock_flag = false;
      } catch (e) {
        console.log('something wrong when resolving origin response, return directly....');
        callback(serverResData)
      }
      // conditions must be matched here:
      // 1. must be rules, either global rule or api rule, or both of them
      // 2. origin response must be json format, and not null

      // apply global rule first if it's not empty(because api rule can override it)
      if (!tools.isEmpty(mock_rules.global)) {
        console.log('global rule specified, now apply global rule');
        record_data(req, serverResData)
        mockResData = gen.gen_mock(mockResData, mock_rules.global)
        global_mock_flag = true
      }

      if (!tools.isEmpty(mock_rules.api)) {
        // when api rule specified
        var find_flag = false,
          api_index;
        for (api_index in mock_rules.api) {
          if (req.url.indexOf(api_index) != -1) {
            console.log('hit api!')
            console.log('origin reuest url:' + req.url)
            find_flag = true
            break
          }
        }
        if (find_flag) {
          console.log('api catched!!! return modified response')
          if (!global_mock_flag) {
            record_data(req, serverResData)
          }
          mockResData = gen.gen_mock(mockResData, mock_rules.api[api_index])
        } else {
          console.log('api missed... return origin response')
        }
      } else {
        console.log('api unspecified');
      }
      callback(JSON.stringify(mockResData))
    } else {
      callback(serverResData)
    }
  }
}


module.exports = rule
