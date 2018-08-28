'use strict';

const http = require('http');
const fetch = require('node-fetch');
const fs = require('fs');
const zmq = require('zmq');
const puller = zmq.socket('pull');
const rep = zmq.socket('rep');
const spawn = require('child_process').spawn;
const isOnline = require('is-online');
const utils = require('./utils');
const default_video = 'default.mp4';

const address = 'tcp://localhost:8888';
const req_adress = 'tcp://localhost:8880';

const video_storage_path = 'videos/';     // for VLC player, f for fullscreen and L for loop
const player_args = ['-f', '-L', '--one-instance', '--playlist-enqueue'];
const player_program = 'vlc';
const log_folder = 'logs/';
const server_url = 'http://localhost:8000/';

class VideoPlayer {
    constructor() {

        //unique log file based on the current date
        this.player_log_file = utils.generateName();

        //creating the log folder and the video folder
        if (!fs.existsSync(log_folder)) fs.mkdir(log_folder);
        if (!fs.existsSync(video_storage_path)) fs.mkdir(video_storage_path);

        this.log_file = fs.createWriteStream(log_folder + this.player_log_file);
        //Comment the line below to see the log on the console
        process.stdout.write = process.stderr.write = this.log_file.write.bind(this.log_file);

        this.getPlaylist()
        .then ((result) => {
            this.playlist = result;
            console.log(this.playlist.playlist_items);
            this.startPlayer();
        })
        .catch((err) => {
            console.log(err);
            
            this.playDefault();
        });
        
    }

    playDefault() {
        console.log('default');
        this.player = spawn('vlc', ['-f', default_video]);

    }

    updatePlaylist(new_playlist) {
        this.playlist = new_playlist;
        this.player.kill();
        this.startPlayer();
    }
    
    getPlaylist() {
        /*
        Two scenarios : online and offline
        online: retreiving the playlist from the server
        offline: retreiving the playlist from a local file,
                if that fails, use a default video
        all the above is implemented using promises
        */ 

        return new Promise((resolve, reject) => {
            isOnline()
            .then(online => {
                //It's temporary, should be a fetch instead

                fetch(server_url + 'dump')
                    .then(res => res.json())
                    .then(json => resolve(json))
                    .catch(err => console.error(err));

            })

            .catch((err) => {
                fs.readFile('playlist.json', (err, data) => {
                    if (err){
                        console.log('offline');
                        reject(err);
                        
                    }
                    resolve(data.toString());
                })
    
            });
    
        });
    }

    //This method gives us two arrays
    //onDisk: Videos present localy, so no download needed
    //toDownload: videos not yet downloaded
    verifyFiles() {
        this.videoList = {
            onDisk: [],
            toDownload: []
        };

        this.playlist.playlist_items.forEach(element => {
            let video_url = element['url'];
            let video = video_storage_path +  video_url.split('/').pop();

            if(fs.existsSync(video)){
                this.videoList.onDisk.push(video);
            }
            else{
                //for the download, we need the link
                this.videoList.toDownload.push(video_url);
            }
        });
    
//        return videoList;
    }

    addToPlaylist (video) {
        console.log('Downloaded');
        this.videoList.onDisk.push(video);    
        //to remove duplication from vlc playlist  
        this.openPlayer(video);
    }

    downloadMissing (){
        console.log('Downloading ...');
        this.videoList.toDownload.forEach(video_url => {
            let video = video_storage_path + video_url.split('/').pop();
            let file = fs.createWriteStream(video);
            let request = http.get(video_url, res => {
                res.pipe(file);
                res.on('end', () => this.addToPlaylist(video));
            });
        });
    }

    startPlayer () {
        
        this.verifyFiles();
        console.log(this.videoList);
        //download the missing, if there is
        if (this.videoList.toDownload.length > 0) {
            console.log("ddd");

            this.downloadMissing();
        }
        //set the videos to the default
        //if there are vids on disks, play them
        console.log("here");

        let videos = video_storage_path + default_video;
        if (this.videoList.onDisk.length > 0)
        {
            console.log("here 2");
            
            videos = this.videoList.onDisk;
        }
        this.openPlayer(videos);
        
    }

    openPlayer(videos) {
//        if (this.player != null) this.player.kill();
        let args = player_args.concat(videos);
        console.log(args);
        this.player = spawn(player_program, args);
        this.player.stderr.pipe(process.stderr);
    }

    kill() {
        this.player.kill();
    }

    sendLog() {
        fs.readFile(log_folder + this.player_log_file, (err, data) => {
            if (err) {
                rep.send('Error');
            }
            else {
                rep.send(data);
            }
        });
    }

}

let videoPlayer = new VideoPlayer();

setInterval (() => {
    fetch(server_url + 'dump')
        .then(res => res.json())
        .then(json => videoPlayer.updatePlaylist(json))
        .catch(err => console.error(err));

}, 3600000);

/* Not now bitch
//for receiving playlist
puller.on('message', function(data) {
    let msg = JSON.parse(data);
    console.log("message is :" + data);
    videoPlayer.updatePlaylist(msg);
});
rep.on('message', function(data) {
    if (data == "send") {
        videoPlayer.sendLog();
    }
});

puller.connect(address);
rep.bind('tcp://127.0.0.1:8880', function(err) {
  console.log('Listening for zmq requesters...');
});

console.log('listening ...');
//puller.connect('tcp://localhost:5434');
*/