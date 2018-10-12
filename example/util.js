var fs = require('fs')
var Path = require('path')

var util = {
  isBlank: function (obj) {
    return obj === undefined || obj === null || obj.length === 0
  },
  writeFile: function (fullpath, content) {
    return fs.writeFile(fullpath, content, 'utf8')
  },
  readFile: function (fullpath) {
    return fs.readFileSync(fullpath, 'utf8')
  },
  pathExistsSync: function (fullpath) {
    return fs.existsSync(fullpath)
  },
  mkdirpSync: function (fullpath) {
    return fs.mkdirSync(fullpath)
  },
  join: function (...paths) {
    paths = paths.filter(it => it !== null)
    return Path.join(...paths)
  }
}

module.exports = util
