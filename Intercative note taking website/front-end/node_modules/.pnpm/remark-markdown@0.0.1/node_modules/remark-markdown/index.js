'use strict'
var visit = require('unist-util-visit')
var parse = require('remark-parse')
var elements = require('remark-parse/lib/block-elements')
module.exports = markdown

function markdown(options) {
  options = options || {}
  var self = this

  var parserOpt = Object.assign({ blocks: elements }, options)
  parserOpt.blocks.push('markdown')
  this.use(parse, parserOpt)

  return function (node) {
    visit(node, 'html', function (node, index, parent) {
      var val = node.value
      var prefix = ''
      var openNum = 0
      var i = 0
      var len = val.length
      var rest
      var children = []
      while (i < len) {
        var ch = val.charAt(i)
        rest = val.substring(i)
        if (rest.startsWith('<markdown>')) {
          i += 9
          if (openNum > 0 && prefix) {
            children = children.concat(self.parse(prefix))
            prefix = ''
          }
          children.push({
            type: 'html',
            value: prefix + '<markdown>'
          })
          openNum++
          prefix = ''
        } else if (rest.startsWith('</markdown>')) {
          i += 10
          if (0 === openNum) {
            children.push({
              type: 'html',
              value: prefix + '</markdown>'
            })
            prefix = ''
          }
          else {
            openNum--
            prefix && (
              children = children.concat(
                self.parse(prefix),
                {
                  type: 'html',
                  value: '</markdown>'
                }
              )
            )
            prefix = ''
          }
        }
        else {
          prefix += ch
        }

        i++
      }

      if (openNum === 0) {
        if (prefix) {
          children.push({
            type: 'html',
            value: prefix
          })
        }
      }

      if (openNum === 0 && children.length) {
        parent.children.splice.apply(
          parent.children,
          [
            index,
            1,
          ].concat(
            children
          )
        )
      }
    })
  }
}

