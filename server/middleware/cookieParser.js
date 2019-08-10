const parseCookies = (req, res, next) => {

  if (req.headers.cookie) {
    let arr = req.headers.cookie.split('; ');
    for (let i = 0; i < arr.length ; i++) {
      req.cookies[arr[i].split('=')[0]] = arr[i].split('=')[1];
    }
  }
  next();
};

module.exports = parseCookies;