const axios = require('axios')

const instance = axios.create({
  baseURL: 'https://api.imgur.com',
  timeout: 10000,
  headers: {'Authorization': 'Client-ID 6b4ed3be862fc6f'},
  validateStatus: (status) => {
    return status >= 200 && status != 500; // default
  },
});


const getGallery = ({q='', page=0}) => {
  return instance.get(`/3/gallery/search/${page}/?q=${q}`).then(({data}) => {
    return data.data
  })
}

const getImage = ({id=''}) => {
  return instance.get(`/3/image/${id}`).then(({status, data}) => {
    if(status == 200) {

      return data.data
    }
  })
}

const getAllImages = ({q=''}) => {
  return getGallery({q}).then((r) => {
    return axios.all(r.map((t) => {
      if (typeof t.cover != 'undefined') {
        return getImage({id:t.cover}).then((data) => {
          if(data && data.link && typeof data.link != 'undefined' && data.type != 'image/gif') {
            return data.link
          }
        })
      }
    })).then((r) => {
      return r.filter((item) =>  typeof item != 'undefined')
    }).catch((err) => {
      console.log(err)
    })
  });
}

module.exports = { getAllImages }
