## Dropbox-powered Blog Thing

<!-- [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy) -->

### Setup

 1. Download the latest release of DpBT and unpack it to a folder on your server
 2. Configure your site using the the `config.json` file
 6. If everything is setup correctly, make a symlink from your blog posts folder to the `/posts` folder in the root of this project
    Example: `ln -s ~/Dropbox/blog/posts ./posts` where `./posts` is the posts folder in the root of the project
 7. Start the server (if setup correctly it should just work): node server.js
 8. From your original posts folder, you can create new, or convert old, markdown posts with the filename `.md`
    and the following format 
    ```
    ---
    title: This is the post title
    date: 2014-08-08
    tags (optional): a tag, another tag
    type (optional): page # used to denote a static page accessible in the navigation rather than a post
    <other metadata in the form of key: value>
    ---

    # Header

    This is some awesome content
    ```


## Global template variables

There are a tonne of template variables to be used, but the basics are:

`baseUrl` - the base URL of the site, example: 
```html
<head>
  <base href="{{baseUrl}}" />
  <title></title>
</head>
```

`gravatar` - the URL to your gravatar image based on the value of `site.author.email` in `config.json`
```html
<img src="{{gravatar}}" alt="This is my avatar" />
```

``

The rest of the variables are available via their respective route. A few are:
```
GET / 
> {
    posts: Array   // an array of post objects
  }

GET /page/2
> {
    page        : Integer, // the current pagination page number
    posts       : Array,   // an array of post objects
    pagination  : Object   // an object containing pagination data
  }

GET /this-is-a-post-title
> {
    meta    : Object, // contains at least *title* and *date*, can also contain arbitrary meta data
    content : String  // the post content in a large string
  }

GET /rss(.xml) (.xml in url is optional)
> Generated Atom 1.0 XML feed for RSS of all posts

GET /sitemap(.xml) (.xml in url is optional)
> Generated sitemap XML feed for all pages and posts on site for sitemap


[COMING SOON]
GET /tag/a-simple-tag
GET /
```


## Contributing

Contributions are very welcome! In lieu of a formal styleguide, please retain the current code style. Add any relevant tests if you're adding new features, etc.


### License 

The MIT License (MIT)

Copyright (c) 2014 Brandon Brown

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
