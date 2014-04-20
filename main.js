var fs = require('fs');
var log = require('winston');
var _path = require('path');
var util = require('util');

var blacklist = {};

var isBlacklisted = function(filename) {
    var blacklisted = false;

    for (var exp in blacklist) {
        if (filename.match(exp) !== null) {
            blacklisted = true;
            if (typeof blacklist[exp] === 'function')
                blacklist[exp](filename);
        }
    }

    return blacklisted;
};

var stat = function(opts, cb) {
    fs.stat(opts.path, function(err, stat) {
        if (err)
            cb(err, stat, opts.path);
        else {
            var fullPath = _path.join(opts.path, opts.filename);
            fs.stat(fullPath, function(err, stat) {
                cb(err, stat, fullPath);
            });
        }
    });
};

function SimpleTreeWatch() {
    this.watchList = {};
    this.actions = [];
}

SimpleTreeWatch.prototype.setLogLevel = function(level) {
    log.level = level;
};

SimpleTreeWatch.prototype.blacklist = function(exp, cb) {
    blacklist[exp] = cb;
};

SimpleTreeWatch.prototype.addAction = function(action) {
    this.actions.push(action);
};

SimpleTreeWatch.prototype.cancelWatch = function(path) {
    this.watchList[path].close();
    delete this.watchList[path];
    log.verbose("Cancelled watching: '" + path + "'");
};

SimpleTreeWatch.prototype.watch = function(path) {
    var self = this;

    if (self.watchList[path]) {
        log.verbose("Already being watched, watch cancelled: '" + path + "'");
        return false;
    }

    var watchCb = function watchCb(event, filename) {
        if (isBlacklisted(filename)) return false;
        stat({
            path: path,
            filename: filename
        }, function(err, stat, fullPath) {
            var isDir;
            var realEvent;

            if (!err) {
                isDir = stat.isDirectory();
                if (isDir && !isBlacklisted(_path.basename(fullPath)))
                    self.watch(fullPath);
            }

            if (err && err.code === 'ENOENT') realEvent = 'delete';
            if (!err && (event === 'change' || event === 'rename')) realEvent = 'update';

            if (realEvent === 'delete' && self.watchList[fullPath]) {
                self.cancelWatch(fullPath);
            }

            self.actions.forEach(function(action) {
                action({
                    fsevent: event,
                    event: realEvent,
                    filename: filename,
                    path: path,
                    fullPath: fullPath,
                    stat: stat
                });
            });
        });

    };

    this.watchList[path] = fs.watch(path, watchCb);

    log.verbose("Started watching: '" + path + "'");

    fs.readdir(path, function(err, files) {
        if (err) throw err;

        files.forEach(function(f) {
            var pathToFile = _path.join(path, f);
            if (!isBlacklisted(f))
                fs.stat(pathToFile, function(err, stat) {
                    if (stat.isDirectory())
                        self.watch(pathToFile);
                });
        });
    });
};

module.exports = SimpleTreeWatch;