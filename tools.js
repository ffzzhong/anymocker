'use strict';

function isEmpty(obj) {
  for (var name in obj) {
    return false;
  }
  return true;
};

module.exports = {
  isEmpty: isEmpty
}
