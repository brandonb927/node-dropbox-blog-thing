# Dropbox-powered Blog Thing

**tl;dr** I wrote this blog "thing" to scratch my own itch, so if you have some time on your hands and you happen to like node.js, 
you can have a sweet Dropbox-powered blog like mine running on your own server.

The whole project is inspired by http://joehewitt.com/2011/10/03/dropbox-is-my-publish-button. For the sake of the following setup 
procedure, it is imperative that you read this article before starting. Incase that post dissappears, here is the relevant quote:

> Start by installing the Dropbox Linux command line client. At the end of the install script, it will ask you to link your Dropbox account by copying and pasting a URL into your browser. **Do not do this yet**. If you do, it will link your personal Dropbox account to the server, downloading the hundreds of megabytes of files you may have on Dropbox, and exposing potentially sensitive files to any intrepid hacker who breaks into your server.
> 
> You only want to synchronize the files needed by your CMS, so you need to create a new Dropbox account that is dedicated to this purpose. Of course, the Dropbox client only works with one account at a time, and your personal computer is going to be logged into your personal account. Luckily, Dropbox folder sharing solves this problem nicely. Once you have your new account, go to your personal account and share the folder containing your CMS files with the new account. Then you can link the new account to your server. Be sure you are logged into the new account in your browser, and then load that URL the installer gave you. Done.


## Overview

The basic overview of what we're accomplishing here is as follows:
- [Setting up a simple Ubuntu server on Amazon EC2 (or your preferred distro)](#amazon-ec2-instance-or-other-ubuntu-server)
- [Installing the Dropbox-cli client](#dropbox-cli)
- [Installing and configuring all the relevant packages to run the site](#nodejs--npm)
- [Setting up git hooks for seemless push-to-deploy procedure](#git-push-to-deploy)
- [Setting up the NodeJS app `config.json` with your information](#configuring-the-app)
- ???
- [PROFIT](http://1.bp.blogspot.com/-OnJtmIOFb3w/UBroj-ycpYI/AAAAAAAAB_I/F9oSLxwAAxk/s1600/mayweather-money.gif)

The whole thing is built on top of NodeJS and is completely self-contained. This means there is no database, or file storage 
(other than your Dropbox folder). All post/page data is initialized into memory when the server is started up and on sebsequent restarts.
This means when a page is requested there is no filesystem read making the whole page-load VERY fast. `watchr` is used to listen for 
filesystem changes for when you update or add document to your Dropbox folder and will re-cache all post/page data again.

TODO:
- only re-cache updated/added files


## Setup

Setting up this project to work on AWS EC2 isn't too hard, but it is fairly technical if you don't kno wwhat you're doing.
Follow along closely and you should be fine!

Most of the setup is derived from a few places:
- http://techprd.com/setup-node-js-web-server-on-amazon-ec2/
- http://cuppster.com/2011/05/12/diy-node-js-server-on-amazon-ec2/

Let's get started shall we? 

### Amazon EC2 instance (or other Ubuntu server)

Start by creating an EC2 instance with an Elastic IP if you don't have one, and setup your Security Group with allowing 
ports 22, 80, and 443 (optional) inbound from any source. You can set it up however you like, 
but for the sake up this project, these are the few ports you need for the server to serve content.

### Dropbox-cli

Make sure you server is completely up to-date before you continue. Once you've done that, 
setup the Dropbox-cli client on the server.

    wget -O dropbox.py "https://www.dropbox.com/download?dl=packages/dropbox.py"
    chmod +x dropbox.py
    dropbox.py start

The only outstanding issue now is that if the server reboots or crashes for any reason, you'll have
to SSH in and start the Dropbox daemon. This is not an ideal circumstance, but one that can be alleviated
with an `init.d` script!

Create a new file `/etc/init.d/dropbox` and put the contents of this Gist into it: https://gist.github.com/brandonb927/a0b33ecbe6fa8337b0b4

Now ensure that you you set the script as executable and add it to the server startup sequence

    chmod +x /etc/init.d/dropbox 
    update-rc.d dropbox defaults

### Node.js & npm

Once you've got Dropbox setup, go ahead and install the latest version of Node (0.10.30) as of this writing.

    sudo apt-get install build-essential libssl-dev git-core rcconf nginx
    tar xzf node-latest.tar.gz && cd node-v0.10.30
    ./configure --prefix=/usr && make && sudo make install

After you install `node`, you'll wanna install `npm` as well. `npm` is one of the most popular package managers
for `node`.

    cd ~ && git clone http://github.com/isaacs/npm.git
    cd npm && sudo make install

### Nginx

Now it's time to setup `nginx` as a reverse proxy for the `node` app. Copy the default site as a backup,
then edit the original and delete it's contents.

    sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.BAK
    sudo vim /etxnginx/sites-available/default
    
Replace default file contents with with the following:

    server {
      listen 80; # or 443 if you're running secure site
      server_name localhost;

      location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy true;
        proxy_pass http://127.0.0.1:3000; # of the port you set in the confi.json later on
        proxy_redirect off;
      }
    }

then restart `nginx`

    sudo service nginx restart

### Supervisor & rcconf

So now we technically have a working environment for a node app, but we want to make sure that in the event
that the app shuts down or ungracefully has it's process killed, it can start itself back up again. This is where 
`supervisor` comes into play. `supervisor` is a process control system that can ensure your app always stays running.
You can install `supervisor` from `pip`, the popular python package manager (because nobody has time for `easy_install`).

    sudo apt-get install python-setuptools
    sudo easy_install pip
    sudo pip install supervisor

We want `supervisor` to be part of the system startup, so we download an `init.d` script to do this.

    curl https://gist.githubusercontent.com/howthebodyworks/176149/raw/88d0d68c4af22a7474ad1d011659ea2d27e35b8d/supervisord.sh > supervisord
    chmod +x supervisord && sudo mv supervisord /etc/init.d/supervisord

`rcconf` manages system startup tasks, so we make sure that `supervisord` (daemon) is checked to run on startup.

    sudo rcconf

Now we generate the `supervisor.conf` that will be used for the app. There are a few ways to do this, like specifying a local config
when running the `supervisor` commant, but for the sake of this project we just add our config to the global `supervisor` config file.

    sudo echo_supervisord_conf > supervisord.conf
    sudo mv supervisord.conf /etc/supervisord.conf

Configure your `supervisor.conf` file like so

    sudo vim /etc/supervisord.conf
      # Under [unix_http_server] uncomment the chmod and change it to 0777
      # Under [supervisord] uncomment user and change the value to ubuntu
      # Under [program:theprogramname] block, add
      [program:node]
      command=node app.js
      directory=/home/ubuntu/LOCATION_OF_PUBLIC_APP
      environment=NODE_ENV=production

then restart `supervisor`

    sudo service supervisord restart

## Git push-to-Deploy

Once you've completed the above, setup git push to deploy using the following steps: http://www.jeffhoefs.com/2012/09/setup-git-deploy-for-aws-ec2-ubuntu-instance/

**Note**: When you're asked to create a new repo on your *local machine*, just clone this repo instead and use that.

## Configuring the app

 1. Change to the directory where your app Configure your site using the the `config.json` file
 2. If everything is setup correctly, make a symlink from your blog posts folder to the `/posts` folder in the root of this project
    Example: `ln -s ~/Dropbox/blog/posts ./posts` where `./posts` is the posts folder in the root of the project
 3. Start the server (if setup correctly it should just work): `node server.js`
 4. From your original posts folder, you can create new, or convert old, markdown posts with the filename `.md`
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

    ![An awesome image](image-filename.png)
    ```

In order for images to load, they must be placed into a folder called `images` in the root of your posts folder in Dropbox. 
ExpressJS will only serve them from there, as relative links to the root of the site. Example: `http://example.com/path-to-image.png`


## Global template variables

There are a bunch of template variables to be used, but the basics are:

`baseUrl` - the base URL of the site 
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


The rest of the variables used are available via their respective route. A few are:
```
GET / # site root
> {
    posts: Array                // an array of post objects
  }

GET /page/2 # posts pagination, where 2 is the page number
> {
    page        : Integer,     // the current pagination page number
    posts       : Array,       // an array of post objects
    pagination  : Object       // an object containing pagination data of the current, prev, and next pages
  }

GET /this-is-a-post-title # post slug, uses the post title
> {
    meta    : Object,          // contains at least *title* and *date*, can also contain arbitrary meta data
    content : String           // the post content in a large string
  }

GET /rss.xml # Atom XML feed of the site
> Generated Atom 1.0 XML feed for RSS of all posts

GET /sitemap.xml # Sitemap XML feed for search engines
> Generated sitemap XML feed for all pages and posts on site for sitemap

GET /tag/a-simple-tag # when you tag a post, you can then access a list of posts with that tag from this url
> {
    tag         : String,     // the current tag as a string
    posts       : Array       // an array of post objects
  }
```

All routes accept JSON headers so you can retreive your posts via a JSON API :).


## Base theme

The base theme is built with a customized version of [CardinalCSS](http://cardinalcss.com) and [Simple Grid](https://github.com/brandonb927/simple-grid) 
to give a very minimal, yet functional, blog theme.

Some of the theme features are:
- Full Schema.org support, optimized for a blog
- Opengraph and Twitter Cards support
- Fully responsive and minimal


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
