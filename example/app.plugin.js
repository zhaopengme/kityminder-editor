angular
  .module('kityminderDemo', ['kityminderEditor'])
  .config(function(configProvider) {
    configProvider.set('imageUpload', './server/imageUpload.php')
  })
  .controller('MainController', function($scope) {
    $scope.initEditor = function(editor, minder) {
      window.editor = editor
      window.minder = minder
    }
  })

window.FileUtil = {
  downloadText: function(text, fileName) {
    var blob = new Blob([text])
    saveAs(blob, fileName)
  },
  downloadBase64: function(_base64, fileName) {
    var base64 = _base64.split(',')[1]
    var base64Info = _base64.split(',')[0]
    var type = base64Info.split(';')[0].split(':')
    var bytes = window.atob(base64)
    var ab = new ArrayBuffer(bytes.length)
    var ia = new Uint8Array(ab)
    for (var i = 0; i < bytes.length; i++) {
      ia[i] = bytes.charCodeAt(i)
    }
    var image = new Blob([ab], { type: type })
    saveAs(image, fileName)
  },
  readText: function(blob, callback) {
    var fileReader = new FileReader()
    fileReader.onload = function(e) {
      if (callback) callback(null, e.target.result)
    }
    fileReader.readAsText(blob)
  },
  reasJson: function() {
    FileUtil.readAsText(blob, function(err, s) {
      if (err) {
        if (callback) callback(err)
        return
      }
      if (s) {
        try {
          var json = JSON.parse(s)
          if (callback) callback(null, json)
        } catch (e) {
          if (callback) callback(e)
        }
      }
    })
  },
  readDataURL: function(blob, callback) {
    var fileReader = new FileReader()
    var url = URL.createObjectURL(blob)
    fileReader.onload = function(e) {
      if (callback)
        callback(null, {
          base64: e.target.result,
          url: url
        })
    }
    fileReader.readAsDataURL(blob)
  }
}
$(function() {
  $('.btn-open')
    .off('click')
    .on('click', async function() {
      $('#file-input').trigger('click')
    })
  $('#file-input')
    .off('change')
    .on('change', function() {
      var file = $(this)[0].files[0]
      var fileType = file.name.substr(file.name.lastIndexOf('.') + 1)
      switch (fileType) {
        case 'markdown':
          fileType = 'markdown'
          break
        case 'md':
          fileType = 'markdown'
          break
        case 'km':
          fileType = 'json'
          break
        case 'json':
          fileType = 'json'
          break
        case 'txt':
          fileType = 'text'
          break
        default:
          console.log('File not supported!')
          alert('只支持.km、.json、.md、.markdown、.txt文件')
          return
      }
      var reader = new FileReader()
      reader.onload = function(e) {
        var content = reader.result
        minder.importData(fileType, content).then(function(data) {
          $('#file-input').val('')
        })
      }
      reader.readAsText(file)
    })
  $('.dropdown-menu li')
    .off('click')
    .on('click', async function() {
      var type = $(this)
        .find('a')
        .data('type')
      var fileName =
        minder
          .getRoot()
          .getText()
          .replace(/\n/g, '') || '未命名'
      var result = await minder.exportData(type)
      if (type === 'png') {
        FileUtil.downloadBase64(result, fileName + '.png')
      } else if (
        type === 'freemind' ||
        type === 'markdown' ||
        type === 'svg' ||
        type === 'json' ||
        type === 'text'
      ) {
        var ext = null
        switch (type) {
          case 'freemind':
            ext = 'mm'
            break
          case 'text':
            ext = 'txt'
            break
          case 'json':
            ext = 'km'
            break
          default:
            ext = type
            break
        }
        FileUtil.downloadText(result, fileName + '.' + ext)
      } else if (type === 'xmind') {
        saveAs(result, fileName + '.xmind')
      }
    })
})

$(function() {
  var workpath = null
  var electron = require('electron')
  var ipcRenderer = electron.ipcRenderer
  var util = require('./util')

  ipcRenderer.on('init', function(send, option) {
    workpath = option.workpath
    if (!util.isBlank(option.file)) {
      var data = util.readFile(option.file)
      minder.importData('json', data)
    }
  })

  $('.btn-exit')
    .off('click')
    .on('click', async function() {
      layer.confirm(
        '是否确认退出',
        {
          btn: ['确认', '取消'] // 按钮
        },
        function() {
          ipcRenderer.sendToHost('close', { name: 'kitymind' })
        },
        function() {}
      )
    })

  $('.btn-save')
    .off('click')
    .on('click', async function() {
      var data = await minder.exportData('json')
      var filename = JSON.parse(data).root.data.text
      var dir = util.join(workpath, 'mind')
      if (!util.pathExistsSync(dir)) {
        util.mkdirpSync(dir)
      }
      var file = util.join(dir, filename) + '.km'
      layer.confirm(
        '文件将会保存到[' + file + '],是否确认!',
        {
          btn: ['确认', '取消'] // 按钮
        },
        function() {
          util.writeFile(file, data)
          layer.msg('保存成功')
        },
        function() {}
      )
    })
})
