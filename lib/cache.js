const Memcached = require('memcached');
const memcached = new Memcached('127.0.0.1:11211', { maxExpiration: 3600 });

module.exports = {
  addKey: (k, v) => new Promise((resolve, reject) =>{
    memcached.add(k, v, 1800, (err, result) => {
      if (err || !result) {
        reject(err || result)
      } else {
        resolve(true)
      }
    })
  }),
  getKey: (k) => new Promise((resolve, reject) =>{
    memcached.get(k, (err, data) => {
      if (err || !data) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  }),
  deleteKey: (k) => new Promise((resolve, reject) =>{
    memcached.del(k, (err, result) => {
      if (err || !result) {
        reject(err || result)
      } else {
        resolve(true)
      }
    })
  })
};
