const https = require('https');
const http = require('http');

function check(url) {
  const req = (url.startsWith('https') ? https : http).get(url, (res) => {
    console.log(url + ' -> ' + res.statusCode);
    if (res.headers.location) {
      console.log('Redirects to: ' + res.headers.location);
    }
  });
  req.on('error', console.error);
}

check('http://bishnoi.co.in/.well-known/assetlinks.json');
check('https://bishnoi.co.in/.well-known/assetlinks.json');
check('http://www.bishnoi.co.in/.well-known/assetlinks.json');
check('https://www.bishnoi.co.in/.well-known/assetlinks.json');
