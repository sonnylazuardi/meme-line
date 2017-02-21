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
    bot.replyMessage(replyToken, new Messages().addText(`Selamat Datang di MemeLine, ${displayName}!`).addText({text: 'Cara gampang bikin meme (>.<) \n Silakan masukan tulisan teks pada atas gambar'}).commit())
  })
})

const saveStateText = (sourceId, field, text) => {
  axios.post(`${config.databaseURL}/analytics.json`, {
    userId: sourceId,
    [field]: text
  })
  return axios.patch(`${config.databaseURL}/state/${sourceId}.json`, {
    [field]: text
  }).then(({data}) => {
    return data;
  });
}

const clearState = (sourceId) => {
  return axios.delete(`${config.databaseURL}/state/${sourceId}.json`).then(({data}) => {
    return data;
  });
}

const checkState = (sourceId) => {
  return axios.get(`${config.databaseURL}/state/${sourceId}.json`).then(({data}) => {
    if (!data) {
      return {state: 'needTextTop', stateData: data}
    } else if (data.textTop && data.textBottom) {
      return {state: 'needMemePicture', stateData: data}
    } else if (data.textTop) {
      return {state: 'needTextBottom', stateData: data}
    } else {
      return {state: 'needTextTop', stateData: data}
    }
  })
}

bot.on('event', (event) => {
  axios.post(`${config.databaseURL}/events.json`, event);
})

bot.on('text', ({replyToken, source, source: { type }, message: { text }}) => {
  const sourceId = source[`${type}Id`];
  // bot.replyMessage(replyToken, new Bot.Messages().addText(text).commit());
  // console.log('text', text);
  checkState(sourceId).then(({state, stateData}) => {
    switch (state) {
      case 'needTextTop':
        saveStateText(sourceId, 'textTop', text).then(() => {
          bot.replyMessage(replyToken, new Bot.Messages().addText('Silakan masukan tulisan teks pada bawah gambar').commit());  
        });
        break;
      case 'needTextBottom':
        saveStateText(sourceId, 'textBottom', text).then(() => {
          bot.replyMessage(replyToken, new Bot.Messages().addText('Silakan upload gambar background').commit());  
        });
        break;
      case 'needMemePicture':
        bot.replyMessage(replyToken, new Bot.Messages().addText('Silakan upload gambar background').commit());  
        break;
    }
  })
  
});

bot.on('image', (e) => {
  let msgs = new Bot.Messages();
  const randomName = uuid.v4()
  const { message: { id }, source, source: {type} } = e;
  let sourceId = source[`${type}Id`];

  checkState(sourceId).then(({state, stateData}) => {
    if (state == 'needMemePicture') { 
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
          return createMeme({picture: filePath, top: stateData.textTop, bottom: stateData.textBottom, randomName: randomName})
        })
        .then(replyImage => {
          clearState(sourceId).then(() => {
            axios.post(`${config.databaseURL}/analytics.json`, {
              userId: sourceId,
              memePicture: replyImage
            });
            msgs
              .addText('Ini dia hasil meme yang berhasil dibuat')
              .addImage(replyImage)
              .addText('Silakan masukan tulisan teks pada atas gambar')
            bot.replyMessage(e.replyToken, msgs.commit());
          });
        })
        .catch(err => console.error(err));
    } else {
      bot.replyMessage(e.replyToken, new Bot.Messages().addText('Belum saatnya upload gambar').commit());  
    }
  });
});

const createMeme = ({ picture, top, bottom, randomName }) => {
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
        
          try {
            fs.unlink(memefilename);
            fs.unlink(`./buffer/${randomName}.jpg`);
          } catch (e) {
            console.log('ERROR DELETING FILE', e);
          }

          return resolve({originalUrl: publicUrl, previewUrl: publicUrl})
        });
      }
    });
  })
};


// const initMeme = ({user}) => {
//   return
// }
