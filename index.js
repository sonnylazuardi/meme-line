const Bot = require('node-line-messaging-api');
const axios = require('axios');
const memecanvas = require('memecanvas');
memecanvas.init('./images', '-meme');
const ID = `1501426113`
const SECRET = `f5494121240b9b28455326b598d136cb`
const TOKEN = `Q8D1JSQxJzrO7dtU+JuJbebMVFx14wNVh+3ragq6uHdZaHMjO/4ekz6/0e/Ii30ZHvyplC9GVeaKFQP5pebnT5I5R6eCFNFDRFfnbhfmTUE7SZFSFFH2SwTk5C8N0KF7cTavOxvfBpWPWQGeudSzXgdB04t89/1O/w1cDnyilFU=`
var fs = require('fs');
var gcloud = require('gcloud');
var uuid = require('uuid');

var config = {
  apiKey: "AIzaSyA0TWPApytG050nP7bRFcvbab7o5xFSRwI",
  authDomain: "memeline-76501.firebaseapp.com",
  databaseURL: "https://memeline-76501.firebaseio.com",
  storageBucket: "memeline-76501.appspot.com",
  messagingSenderId: "1006578959505"
};

// Get a reference to the storage service, which is used to create references in your storage bucket
// Create a root reference
const gcs = gcloud.storage({
    projectId: 'memeline-76501',
    keyFilename: './memeline.json'
});

const bucket = gcs.bucket(`memeline-76501.appspot.com`);

const PORT = process.env.PORT || 3002

// console.log(new Bot.default())
let bot = new Bot(SECRET, TOKEN, { webhook: { port: PORT, ngrok: false } })
//
// // bot webhook succesfully started
bot.on('webhook', w => {
  console.log(`bot listens on port ${w}.`)
  const ts = new Date()
  axios.get('https://ipinfo.io').then(({data}) => data).then(console.log).catch(console.error)
})

bot.on('text', (e) => {
  let msgs = new Bot.Messages();
  msgs.addText('Selamat Datang di MemeLine!').addText({text: 'Cara gampang bikin meme (>.<)'})
  bot.replyMessage(e.replyToken, msgs.commit());
});

bot.on('image', (e) => {
  let msgs = new Bot.Messages();
  var randomName = uuid.v4();

  bot.getContent(e.message.id).then(response => {
    fs.writeFile(`./buffer/${randomName}.jpg`, new Buffer(response.data, 'binary'), 'binary', (err) => {
      if (err) throw err;
        memecanvas.generate(`./buffer/${randomName}.jpg`, 'Top of Meme', 'Bottom of Meme', (error, memefilename) => {
          if (error){
              console.log(error);
          } else {
              console.log(memefilename);
              bucket.upload(memefilename, (err, file) => {
                  if (err) { return console.error(err); }
                  let publicUrl = `https://firebasestorage.googleapis.com/v0/b/${'memeline-76501'}.appspot.com/o/${file.metadata.name}?alt=media`;
                  msgs.addText('HASIL:');
                  msgs.addImage({originalUrl: publicUrl, previewUrl: publicUrl});
                  bot.replyMessage(e.replyToken, msgs.commit());
                  try {
                    fs.unlink(memefilename);
                    fs.unlink(`./buffer/${randomName}.jpg`);
                  } catch(e) {
                    console.log('ERROR DELETING FILE', e);
                  }
              });
          }
        });
    });
  });
});