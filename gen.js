'use strict';

var jp = require('jsonpath'),
  lo = require('lodash'),
  tools = require('./tools'),
  mockjs = require('mockjs');

var gen_mock = function(mockResData, scale) {
  var mock_fields = tools.isEmpty(scale.mock) ? [] : scale.mock,
    inject_fields = tools.isEmpty(scale.inject) ? [] : scale.inject,
    delete_fields = tools.isEmpty(scale.delete) ? [] : scale.delete
  console.log('--------------origin response-----------------')
  console.log(mockResData)
  console.log(mock_fields);
  console.log(inject_fields);
  console.log(delete_fields);
  for (var mock_field of mock_fields) {
    console.log(mock_field);
    var seperate_index = mock_field.indexOf('='),
      key = mock_field.substring(0, seperate_index),
      mock_value = mock_field.substring(seperate_index + 1);
    if (mock_value === 'FUZZ') {
      var nodes = jp.nodes(mockResData, key)
      for (var node of nodes) {
        console.log('start fuzzy...');
        mock_value = gen_fuzzy_value(node.value)
        console.log('origin value：' + node.value)
        console.log('after fuzzy：' + mock_value)
        jp.value(mockResData, jp.stringify(node.path), mock_value)
      }
    } else {
      jp.apply(mockResData, key, function(value) {
        return mock_value;
      });
    }
  }
  console.log('--------------after mock-----------------')
  console.log(mockResData)
  for (var inject_field of inject_fields) {
    var seperate_index = inject_field.indexOf('='),
      key = inject_field.substring(0, seperate_index),
      mock_value = inject_field.substring(seperate_index + 1);
    jp.value(mockResData, key, mock_value)
  }
  console.log('--------------after inject-----------------')
  console.log(mockResData)
  for (var delete_field of delete_fields) {
    var paths = jp.paths(mockResData, delete_field)
    for (var path of paths) {
      path.shift()
      lo.unset(mockResData, path)
    }
  }
  console.log('--------------after delete(final)-----------------')
  console.log(mockResData)
  return mockResData
};

var gen_fuzzy_value = function(value) {
  var fuzzy_option = mockjs.mock({
    "isNull|1-9": true,
    "scale": "@D20",
    "zoom|1": true
  })
  if (fuzzy_option.isNull) {
    return null
  } else {
    if (/number/.test(Object.prototype.toString.call(value).toLowerCase())) {
      if (fuzzy_option.zoom) {
        return value * fuzzy_option.scale
      } else {
        return value / fuzzy_option.scale
      }
    }

    if (/string/.test(Object.prototype.toString.call(value).toLowerCase())) {
      if (fuzzy_option.zoom) {
        return mockjs.Random.string(fuzzy_option.zoom) + value + mockjs.Random.string(fuzzy_option.zoom)
      } else {
        if (fuzzy_option.scale >= value.length) {
          return ''
        } else {
          return value.substring(0, fuzzy_option.scale)
        }
      }
    }
    return value
  }
};

module.exports = {
  gen_mock: gen_mock,
  gen_fuzzy_value: gen_fuzzy_value
}
