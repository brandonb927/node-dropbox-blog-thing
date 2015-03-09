require('coffee-script/register')
fs = require('graceful-fs')

###
# Modules are automatically loaded once they are declared
# in the controllers directory.
###

fs.readdirSync(__dirname).forEach (file) ->
  if file isnt 'index.coffee'
    moduleName = file.substr(0, file.indexOf('.'))
    console.log(moduleName)
    exports[moduleName] = require('./' + moduleName)
