"use strict";

const fs = require("fs");
const shell = require("shelljs");
const cron = require("node-cron");

const config = require("../etc/config.json");

const CONFIG_FILE = "/root/.config/rclone/rclone.conf";
const CONFIG_FILE_EXAMPLE = "/root/.config/rclone/rclone.conf.example";

let tasks = [];

function start() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log(
      `Cannot find "${CONFIG_FILE}". An example configuration can be found in "${CONFIG_FILE_EXAMPLE}".`
    );
    process.emit("SIGINT", 1);
  }

  if (!config.remotes) {
    console.log("No remotes found to sync.");
    process.emit("SIGINT", 1);
  }

  console.log("Start google drive sync.");

  tasks = config.remotes.map((remote) => {
    _validateRemote(remote);

    const work = () => {
      console.log("starting task", remote.name);
      const source = remote.source || config.defaultSource || "/";
      const syncOptions = remote.syncOptions || config.defaultSyncOptions || "";

      if (remote.syncLocalToRemote) {
        _syncLocalToRemote(
          remote.name,
          source,
          remote.destination,
          syncOptions
        );
      } else {
        _syncRemoteToLocal(
          remote.name,
          source,
          remote.destination,
          syncOptions
        );
      }
    };

    const task = cron.schedule(remote.cronExpression, work);

    if (remote.runNow) {
      work();
    }

    return task;
  });
}

function stop() {
  console.log("Stopping google drive sync cron jobs.");

  tasks.forEach((task) => {
    task.stop();
  });

  console.log("Stopped google drive sync cron jobs.");
}

function _validateRemote(remote) {
  if (!remote.name) {
    console.log("No name found for the remote.");
    process.emit("SIGINT", 1);
    return;
  }

  if (!remote.destination) {
    console.log(`No distination found for remote ${remote.name}.`);
    process.emit("SIGINT", 1);
    return;
  }

  if (!cron.validate(remote.cronExpression)) {
    console.log(`Cron expression for remote ${remote.name} is not correct.`);
    process.emit("SIGINT", 1);
    return;
  }
}

function _syncRemoteToLocal(remote, source, destination, syncOptions) {
  console.log(
    `Sync files from remote ${remote}:${source} to local ${destination}`
  );

  shell.exec(
    `rclone sync ${remote}:${source} ${destination} ${syncOptions} -v`
  );

  console.log(`Finished syncing files to local ${destination}`);
}

function _syncLocalToRemote(remote, source, destination, syncOptions) {
  console.log(
    `Sync files from local ${source} to remote ${remote}:${destination}`
  );

  shell.exec(
    `rclone sync ${source} ${remote}:${destination} ${syncOptions} -v`
  );

  console.log(`Finished syncing files to remote ${remote}:${destination}`);
}

module.exports = exports = {
  start,
  stop,
};
