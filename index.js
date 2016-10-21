'use strict';

var ArgumentParser = require('argparse').ArgumentParser,
    jp = require('jsonpath'),
    fs = require('fs'),
    path = require('path'),
    proxy = require('anyproxy'),
    url = require('url'),
    lo = require('lodash'),
    beautify = require('js-beautify').js_beautify,
    mockjs = require('mockjs');

var parser = new ArgumentParser({
    version: '0.0.1',
    addHelp: true,
    description: 'fuzzy server usage'
});

parser.addArgument(
    ['-s', '--save'], {
        type: 'string',
        defaultValue: '.',
        help: 'file save path'
    }
);
parser.addArgument(
    ['-p', '--port'], {
        type: 'int',
        defaultValue: 8001,
        help: 'proxy port'
    }
);
parser.addArgument(
    ['-m', '--mock'], {
        action: 'append',
        type: 'string',
        help: 'mock value'
    }
);
parser.addArgument(
    ['-a', '--api'], {
        action: 'append',
        type: 'string',
        help: 'specify url'
    }
);
parser.addArgument(
    ['-i', '--increase'], {
        action: 'append',
        type: 'string',
        help: 'increase field'
    }
);
parser.addArgument(
    ['-r', '--reduce'], {
        action: 'append',
        type: 'string',
        help: 'reduce field'
    }
);


var args = parser.parseArgs();
console.log(args)
var api_index = 0
var record_data = function(req, serverResData) {
    api_index += 1
    var fileSavePath = path.resolve(args.save)
    var reqFile = path.join(fileSavePath, api_index + 'requestData.txt')
    var respFile = path.join(fileSavePath, api_index + 'responseData.txt')
    var reqData
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
        // fs.appendFile(respFile,beautify(serverResData.toString('utf-8'),{indent_size:4}),function (err, data) {
        if (err) {
            return console.error(err);
        }
    });
}

var gen_mock = function(mockResData, mock_fields, increase_fields, reduce_fields) {
    mockResData = JSON.parse(mockResData.toString())
    console.log(mock_fields)
    console.log(increase_fields)
    console.log(reduce_fields)
    console.log('--------------原始值-----------------')
    console.log(mockResData)
    for (var mock_field of mock_fields) {
        var seperate_index = mock_field.indexOf('=');
        var key = mock_field.substring(0, seperate_index);
        var mock_value = mock_field.substring(seperate_index + 1)
        var ret_value = jp.apply(mockResData, key, function(value) {
            return mock_value;
        });
    }
    for (var increase_field of increase_fields) {
        var seperate_index = increase_field.indexOf('=')
        var key = increase_field.substring(0,seperate_index)
        var mock_value = increase_field.substring(seperate_index + 1)
        var ret_value = jp.value(mockResData,key,mock_value)
    }

    for (var reduce_field of reduce_fields) {
        var paths = jp.paths(mockResData,reduce_field)
        console.log(paths)
        for (var path of paths) {
            path.shift()
            lo.unset(mockResData,path)
        }
    }
    console.log('--------------mock值-----------------')
    console.log(mockResData)
    return mockResData
}


var fuzzy_rule = {
    summary: function() {
        return 'mock server working...'
    },

    shouldInterceptHttpsReq: function(req) {
        // switch https on 
        return true
    },

    replaceServerResDataAsync: function(req, res, serverResData, callback) {
        if (/json/i.test(res.headers['content-type'])) {
            var mockResData = serverResData
            var mock_fields = args.mock ? args.mock : []
            var increase_fields = args.increase ? args.increase : []
            var reduce_fields = args.reduce ? args.reduce : []

            if (args.api === null) {
                // callback(serverResData)
                console.log('指定了规则，但是没有指定api，暴力mock')
                if (serverResData.toString() != '') {
                    mockResData = gen_mock(mockResData, mock_fields, increase_fields, reduce_fields)
                    callback(JSON.stringify(mockResData))
                }
            }else {
                console.log('指定了规则，也指定了api')
                var find_flag = false
                for (var api of args.api) {
                    if (req.url.indexOf(api) != -1) {
                        find_flag = true
                        break
                    }
                }
                if (find_flag && serverResData.toString() != '') {
                    record_data(req, serverResData)
                    console.log('指定的api命中！！！ 返回mock数据')
                    mockResData = gen_mock(mockResData, mock_fields, increase_fields, reduce_fields)
                    callback(JSON.stringify(mockResData))
                }else {
                    console.log('指定的api没有命中，返回原始数据')
                    callback(serverResData)
                }
            }
        } else {
            callback(serverResData);
        }
    }
}

var options = {
    rule: fuzzy_rule,
    disableWebInterface: true,
    port: args.port
    // silent: true
}
if (args.mock === null && args.increase === null && args.reduce === null) {
    delete options.rule
    console.log('没有指定规则，返回原始response...')
}

new proxy.proxyServer(options)