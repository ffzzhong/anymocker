'use strict';

var ArgumentParser = require('argparse').ArgumentParser;

var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'anymocker usage'
});

parser.addArgument(
  ['-s', '--save'], {
    type: 'string',
    defaultValue: './save/',
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
    nargs: '*',
    help: 'mock value'
  }
);
parser.addArgument(
  ['-a', '--api'], {
    action: 'append',
    type: 'string',
    nargs: '*',
    help: 'specify url'
  }
);
parser.addArgument(
  ['-i', '--inject'], {
    action: 'append',
    type: 'string',
    nargs: '*',
    help: 'inject field'
  }
);
parser.addArgument(
  ['-d', '--delete'], {
    action: 'append',
    type: 'string',
    nargs: '*',
    help: 'delete field'
  }
);


var args = parser.parseArgs(),
  fields = ['mock', 'inject', 'delete'],
  mock_rules = {
    global: {},
    api: {}
  };

console.log(args)


// #TODO#
// unsolved parameter order analysis
//
//if input parameters are like this:  -a api1 -m x -a api2 -m y -i z
//you intend to make rule below:
// {
//   "api": {
//     "api1": {
//       "mock": [
//         x
//       ]
//     },
//     "api2": {
//       "mock": [
//         y
//       ],
//       "inject": [
//         z
//       ]
//     }
//   }
// }
//but unfortunately, the latter -i z will be squashed as an api1 rule:
// {
//   "api": {
//     "api1": {
//       "mock": [
//         x
//       ],
//       "inject": [
//         z
//       ]
//     },
//     "api2": {
//       "mock": [
//         y
//       ]
//     }
//   }
// }
//
//so , please notice that it's better to set a parameter at a prior place from making mistakes
var parse = function() {
  if (args.api === null) {
    for (var field of fields) {
      if (args[field]) {
        mock_rules.global = mock_rules.global ? mock_rules.global : {}
        if (args[field].length > 1) {
          console.log('something wrong happend when specify a rule: ' + field)
          process.exit(-1);
        } else {
          mock_rules.global[field] = args[field][0]
        }
      }
    }
  } else {
    for (var field of fields) {
      if (args[field]) {
        if (args[field].length - args.api.length > 1) {
          console.log('something wrong happend when specify a rule: ' + field)
          process.exit(-1);
        }
        for (var i in args.api) {
          i = parseInt(i)
          if (i === args[field].length) {
            break;
          }
          for (var j of args.api[i]) {
            mock_rules.api[j] = mock_rules.api[j] ? mock_rules.api[j] : {}
            mock_rules.api[j][field] = args[field][i]
          }
          if (i === args.api.length - 1) {
            // reach max leanth of apis, if there are alse args[field] left, then put them as the global rule
            if (args[field].length > i + 1) {
              mock_rules.global[field] = args[field][i + 1]
            }
          }
        }
      }
    }
  }
  console.log(JSON.stringify(args, null, '  '))
  console.log('-------rules after format----------')
  console.log(JSON.stringify(mock_rules, null, '  '))
  return mock_rules
};

module.exports = {
  parse: parse,
  args: args
}
