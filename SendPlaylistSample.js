'use strict';

const zmq = require('zmq');
const pusher = zmq.socket('push');
const adress = 'tcp://*:8888';

let msg = {
  date_created: "11/08/2018",
  date_fetched: "24/08/2018",
  playlist_items: [{
          url: "videos/d.mp4",
          order: 0,
          duration: 4
      },
      {
          url: "videos/c.mp4",
          order: 1,
          duration: 4
      },
      {
          url: "videos/b.mp4",
          order: 2,
          duration: 4
      },
      {
          url: "videos/a.mp4",
          order: 3,
          duration: 4
      }
  ]
};

pusher.send(JSON.stringify(msg));

pusher.bind(adress, function(err) {
  console.log('Updating the playlist');
});
