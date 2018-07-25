const express = require('express');
const bodyPaser = require('body-parser');
const session = require('express-session');
const massive = require('massive');
const axios = require('axios');

require('dotenv').config();
// massive(process.env.CONNECTION_STRING).then(db => app.set('db', db));

const app = express();
app.use(bodyPaser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false
  })
);
// app.use(express.static(`${__dirname}/../build`));

app.get('/auth/callback', async (req, res) => {
  const payload = {
    client_id: process.env.REACT_APP_AUTH0_CLIENT_ID,
    client_secret: process.env.AUTH0_CLIENT_SECRET,
    code: req.query.code,
    grant_type: 'authorization_code',
    redirect_uri: `http://${req.headers.host}/auth/callback`
  };

  // exchange code in the payload object for a token
  let responseWithToken = await axios.post(
    `https://${process.env.REACT_APP_AUTH0_DOMAIN}/oauth/token`,
    payload
  );
  // exchange the token from the response above for user data
  let responseWithUserData = await axios.get(
    `https://${process.env.REACT_APP_AUTH0_DOMAIN}/userinfo/?access_token=${
      responseWithToken.data.access_token
    }`
  );

  req.session.user = responseWithUserData.data;
  res.redirect('/');
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.send();
});

app.get('/api/user-data', (req, res) => {
  res.json({ user: req.session.user });
});

function checkLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(403).json({ message: 'Unauthorized' });
  }
}

app.get('/api/secure-data', checkLoggedIn, (req, res) => {
  res.json({ someSecureData: 123 });
});

const SERVER_PORT = process.env.SERVER_PORT || 3040;
app.listen(SERVER_PORT, () => {
  console.log('Server listening on port ' + SERVER_PORT);
});
