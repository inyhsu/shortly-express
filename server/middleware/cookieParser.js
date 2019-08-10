const parseCookies = (req, res, next) => {
  console.log('parseCookies',req.headers.cookie);
  if (req.headers.cookie) {
    let arr = req.headers.cookie.split('; ');
    req.cookies = {};
    for (let i = 0; i < arr.length ; i++) {
      req.cookies[arr[i].split('=')[0]] = arr[i].split('=')[1];
    }
  } else {

  }
  next();
};

module.exports = parseCookies;