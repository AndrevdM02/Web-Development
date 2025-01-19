# remark-markdown

The plugin of remark for allowing markdown in `html`
[![build status](https://img.shields.io/travis/imcuttle/remark-markdown/master.svg?style=flat-square)](https://travis-ci.org/imcuttle/remark-markdown)
[![Test coverage](https://img.shields.io/codecov/c/github/imcuttle/remark-markdown.svg?style=flat-square)](https://codecov.io/github/imcuttle/remark-markdown?branch=master)
[![NPM version](https://img.shields.io/npm/v/remark-markdown.svg?style=flat-square)](https://www.npmjs.com/package/remark-markdown)
[![NPM Downloads](https://img.shields.io/npm/dm/remark-markdown.svg?style=flat-square&maxAge=43200)](https://www.npmjs.com/package/remark-markdown)

- Input
```markdown
<div>
# out
<markdown>
# ab
## cd
</markdown>
</div>
```

- HTML Output
```html
<div>
# out
<markdown>
<h1>ab</h1>
<h2>cd</h2>
</markdown>
</div>
```

