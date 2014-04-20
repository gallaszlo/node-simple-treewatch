simple-treewatch
=====================

Simple utility for watching directory tree and file changes.

# Motivation

I could not find a single library that would do exactly what i was looking for, so here is yet another fs.watch wrapper.

This library detects changes in the directory tree and attaches/removes watches as necessary.
It also aims to keep the number of watches low, while still noticing every file change.

# Install

    npm install simple-treewatch

# Usage and features

A very simple example for watching a single directory:

```javascript
var watch = new(require('simple-treewatch'))();

watch.watch("/home/csaba");
watch.addAction(function(data) {
    console.log(data.event + " : " + data.fullPath);
});

```

The above example starts watching the directory tree, with the root being the path set in the parameter. It handles new subdirectories as well. You can add any number of actions to be exectued when an event occurs.

### Logging

To see log messages coming from the watch handler, you can set the logging level to verbose. This prints messages such as watches being started or cancelled.

```javascript
watch.setLogLevel('verbose');
```

### Blacklisting

You can also blacklist certain files via regexp. This regexp will be matched against the file or directory name.

```javascript
watch.blacklist('^[.]');
```

In case you want to get a callback when a certain files is blacklisted, it can be done like this:

```javascript
watch.blacklist('^[.]', function(filename) {
    console.log('Blacklisted event to hidden file/dir: ' + filename);
});

watch.blacklist('^~', function(filename) {
    console.log('Blacklisted event to swap file: ' + filename);
});
```

### Removing watch

Removal of previously started (be it manual or automatic) watches is done automatically.
To manually stop watching a given directory:

```javascript
watch.cancelWatch('/home/csaba');
```