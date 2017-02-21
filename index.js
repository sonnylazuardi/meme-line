const Bot = require('node-line-messaging-api');
const axios = require('axios');
const memecanvas = require('memecanvas');
const fs = require('fs');
const gcloud = require('google-cloud');
const uuid = require('uuid');

const ID = `1501426113`
const SECRET = `f5494121240b9b28455326b598d136cb`
const TOKEN = `Q8D1JSQxJzrO7dtU+JuJbebMVFx14wNVh+3ragq6uHdZaHMjO/4ekz6/0e/Ii30ZHvyplC9GVeaKFQP5pebnT5I5R6eCFNFDRFfnbhfmTUE7SZFSFFH2SwTk5C8N0KF7cTavOxvfBpWPWQGeudSzXgdB04t89/1O/w1cDnyilFU=`

var config = {
  apiKey: "AIzaSyA0TWPApytG050nP7bRFcvbab7o5xFSRwI",
  authDomain: "memeline-76501.firebaseapp.com",
  databaseURL: "https://memeline-76501.firebaseio.com",
  storageBucket: "memeline-76501.appspot.com",
  messagingSenderId: "1006578959505"
};

const gcs = gcloud.storage({
    projectId: 'memeline-76501',
    keyFilename: './memeline.json'
});

const bucket = gcs.bucket(`memeline-76501.appspot.com`);

const PORT = process.env.PORT || 3002

const bot = new Bot(SECRET, TOKEN, { webhook: { port: PORT, ngrok: false } })

memecanvas.init('./images', '-meme');

bot.on('webhook', w => {
  console.log(`bot listens on port ${w}.`)
  axios.get('https://ipinfo.io').then(({data}) => console.log(data)).catch(console.error)
})

bot.on('follow', ({replyToken, source}) => {
  bot.getProfile(source[`${source.type}Id`]).then(({data: {displayName}}) => {
    console.log(displayName)
    bot.replyMessage(replyToken, new Messages().addText(`Selamat Datang di MemeLine, ${displayName}!`).addText({text: 'Cara gampang bikin meme (>.<)'}).commit())
  })
})

bot.on('text', ({replyToken, source}) => {
  bot.replyMessage(replyToken, new Bot.Messages().addText('harambae').commit())
});

bot.on('image', (e) => {
  let msgs = new Bot.Messages();
  const randomName = uuid.v4()
  const { message: { id } } = e
  bot.getContent(id)
    .then(({data}) => {
      const filePath = `./buffer/${randomName}.jpg`
      return new Promise((resolve, reject) => {
        fs.writeFile(filePath, new Buffer(data, 'binary'), 'binary', (err) => {
          if (err) reject(err)
          resolve(filePath)
        })
      })
    })
    .then(filePath => {
      return createMeme({picture: filePath, top: 'TOP MEME', bottom: 'AWESOME'})
    })
    .then(replyImage => {
      msgs.addText('RESULT').addImage(replyImage)
      return bot.replyMessage(e.replyToken, msgs.commit())
    })
    .catch(err => console.error(err))
  // var randomName = uuid.v4();
  // bot.getContent(e.message.id).then(response => {
  //   fs.writeFile(`./buffer/${randomName}.jpg`, new Buffer(response.data, 'binary'), 'binary', (err) => {
  //     if (err) throw err;
  //       memecanvas.generate(`./buffer/${randomName}.jpg`, 'Top of Meme', 'Bottom of Meme', (error, memefilename) => {
  //         if (error){
  //             console.log(error);
  //         } else {
  //             console.log(memefilename);
  //             bucket.upload(memefilename, (err, file) => {
  //                 if (err) { return console.error(err); }
  //                 let publicUrl = `https://firebasestorage.googleapis.com/v0/b/${'memeline-76501'}.appspot.com/o/${file.metadata.name}?alt=media`;
  //                 msgs.addText('HASIL:');
  //                 msgs.addImage({originalUrl: publicUrl, previewUrl: publicUrl});
  //                 bot.replyMessage(e.replyToken, msgs.commit());
  //                 try {
  //                   fs.unlink(memefilename);
  //                   fs.unlink(`./buffer/${randomName}.jpg`);
  //                 } catch(e) {
  //                   console.log('ERROR DELETING FILE', e);
  //                 }
  //             });
  //         }
  //       });
  //   });
  // });
});

// const getMemeByUser = (sourceId) => {
//   const currentMemeRef = usersRef.ref(`${sourceId}/currentMeme`)
//   return currentMemeRef.once('value')
//     .then((snapshot) => {
//       const currentMeme = snapshot.val()
//       const newMeme = {picture: null, top: null, bottom: null}
//       if (!currentMeme) {
//         return currentMemeRef.push(newMeme).then(() => Promise.reject(newMeme))
//       } else {
//         return Promise.resolve(currentMeme)
//       }
//     })
// }

const createMeme = ({ picture, top, bottom }) => {
  const randomName = uuid.v4();
  return new Promise((resolve, reject) => {
    memecanvas.generate(picture, top, bottom, (
      error,
      memefilename
    ) => {
      if (error) {
        console.log(error);
        reject(error)
      } else {
        console.log(memefilename);
        bucket.upload(memefilename, (err, file) => {
          if (err) {
            console.error(err)
            return reject(err);
          }
          let publicUrl = `https://firebasestorage.googleapis.com/v0/b/${'memeline-76501'}.appspot.com/o/${file.metadata.name}?alt=media`;
          return resolve({originalUrl: publicUrl, previewUrl: publicUrl})
          // msgs.addText('HASIL:');
          // msgs.addImage({ originalUrl: publicUrl, previewUrl: publicUrl });
          // bot.replyMessage(e.replyToken, msgs.commit());
          try {
            fs.unlink(memefilename);
            fs.unlink(`./buffer/${randomName}.jpg`);
          } catch (e) {
            console.log('ERROR DELETING FILE', e);
          }
        });
      }
    });
  })
};


// const initMeme = ({user}) => {
//   return
// }
