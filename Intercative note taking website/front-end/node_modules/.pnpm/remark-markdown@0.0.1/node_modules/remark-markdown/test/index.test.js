/**
 * @file index
 * @author Cuttle Cong
 * @date 2018/2/24
 * @description
 */
const remark = require('remark')
const html = require('remark-html')
const stringify = require('remark-stringify')
const mark = require('../index')
const openCloseTag = require('../utils/html').openCloseTag

describe('html openTag', function () {
  it('<div></div>', () => {
    expect(openCloseTag.test('<div></div>')).toBeTruthy()
  })

  it('<div>asd</div>', () => {
    expect(openCloseTag.test('<div>sss</div>')).toBeTruthy()
  })

  it('<div a="xx"/>', () => {
    expect(openCloseTag.test('<div a="xx"/>')).toBeTruthy()
  })

  it('<0ss a="xx"/>', () => {
    expect(openCloseTag.test('<div a="xx"/>')).toBeTruthy()
  })
  it('aa<0ss a="xx"/>', () => {
    expect(openCloseTag.test('aa<div a="xx"/>')).toBeFalsy()
  })

  it('</div>', () => {
    expect(openCloseTag.test('</div>')).toBeTruthy()
  })
})

describe('main', function () {
  test('illegal block', () => {
    remark()
      .use(html)
      .use(mark)
      .process('asd<markdown>## h</markdown>', function (err, content) {
        expect(err).toBeNull()
        expect(content.contents.trim()).toBe('<p>asd<markdown>## h</markdown></p>')
      })
  })

  test('right block', () => {
    remark()
      .use(html)
      .use(mark)
      .process('<markdown>## h #x\n ## hh</markdown>', function (err, content) {
        expect(err).toBeNull()
        expect(content.contents.trim()).toBe('<markdown>\n'
                                             + '<h2>h #x</h2>\n'
                                             + '<h2>hh</h2>\n'
                                             + '</markdown>')
      })
  })

  test('right block case', () => {
    remark()
      .use(html)
      .use(mark)
      .process('<markdown>\n'
               + '## h #x\n '
               + '## hh\n'
               + '</markdown>', function (err, content) {
        expect(err).toBeNull()
        expect(content.contents.trim()).toBe('<markdown>\n'
                                             + '<h2>h #x</h2>\n'
                                             + '<h2>hh</h2>\n'
                                             + '</markdown>')
      })
  })

  test('right block case 2', () => {
    remark()
      .use(html)
      .use(mark)
      .process('<span>abc</span>\n'
               + '<div>'
               + '<span>a</span>\n'
               + '<markdown>\n'
               + '## hxx\n '
               + '## hh\n'
               + '<div>abc</div>\n'
               + '</markdown>'
               + '<span>abc</span>'
               + '</div>', function (err, content) {
        expect(err).toBeNull()
        expect(content.contents.trim()).toBe(
          '<p><span>abc</span></p>\n'
          + '<div>'
          + '<span>a</span>\n'
          + '<markdown>\n'
          + '<h2>hxx</h2>\n'
          + '<h2>hh</h2>\n'
          + '<div>abc</div>\n'
          + '</markdown>\n'
          + '<span>abc</span>'
          + '</div>'
        )
      })
  })

  test('inline html', () => {
    remark()
      .use(html)
      .use(mark)
      .process('<span>xxx</span></div>', function (err, content) {
        expect(content.contents.trim()).toBe('<p><span>xxx</span></div></p>')
      })
  })

  test('block html ', () => {

    remark()
      .use(html)
      .use(mark)
      .process('<div><span>xxx<markdown># a</markdown>hh<markdown># b</markdown></span></div>', function (err, content) {
        expect(content.contents.trim()).toBe('<div><span>xxx<markdown>\n'
                                             + '<h1>a</h1>\n'
                                             + '</markdown>\n'
                                             + 'hh'
                                             + '<markdown>\n'
                                             + '<h1>b</h1>\n'
                                             + '</markdown>\n'
                                             + '</span></div>')
      })
  })


  test('complicated', function () {
    var str = require('fs').readFileSync(__dirname + '/fixture/main.md').toString()
    remark()
      .use(html)
      .use(mark)
      .process(str, function (err, con) {
        expect(con.contents).toMatchSnapshot()
      })
  })
})
