###
# Add's some syntactic sugar to protype methods
###

# https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
if !String::startsWith
  Object.defineProperty String.prototype, 'startsWith',
    enumerable: false
    configurable: false
    writable: false
    value: (searchString, position) ->
      position = position or 0
      @lastIndexOf(searchString, position) == position
# https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
if !String::endsWith
  Object.defineProperty String.prototype, 'endsWith', value: (searchString, position) ->
    subjectString = @toString()
    if position == undefined or position > subjectString.length
      position = subjectString.length
    position -= searchString.length
    lastIndex = subjectString.indexOf(searchString, position)
    lastIndex != -1 and lastIndex == position
