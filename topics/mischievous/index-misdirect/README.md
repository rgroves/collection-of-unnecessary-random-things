# Index Misdirect

Sure, it looks like the result served up by a typical web server for an improperly protected directory with no index page... but is it? Are you sure about that?

I recently decided to host some one off rando creations on an old domain of mine and while deploying things I found that I forgot to add an index page to a sub-directory and instead of adding an .htaccess page with `Options -Indexes` or just throwing an empty index page in there, I decided to do this instead.

You can see it at [digitalsolitude.com/labs](https://digitalsolitude.com/labs/)
