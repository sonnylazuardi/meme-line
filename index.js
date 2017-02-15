const Bot = require('node-line-messaging-api')
const axios = require('axios')
const ID = `1501418012`
const SECRET = `a07e7943a614e3ebb803f4655cea210d`
const TOKEN = `bzNTaLlCN9rnPUBtHhzpwTJl9WELuE5LKU52tcSoBpsSFSLVocOtjIeLaUIQ7XI4vEpsEC2AamqK/0RHlFGLhiu/F4adCnGFtFQsyY1o4G5TtHDGCpGFvRFEnXaof793a94Mbh+qRuXOu5CzwXmHRAdB04t89/1O/w1cDnyilFU=`


const PORT = process.env.PORT || 3002

// console.log(new Bot.default())
let bot = new Bot(SECRET, TOKEN, { webhook: { port: PORT, ngrok: true } })
//
// // bot webhook succesfully started
bot.on('webhook', w => {
  console.log(`bot listens on port ${w}.`)
  const ts = new Date()
  axios.get('https://ipinfo.io').then(({data}) => data).then(console.log).catch(console.error)
})