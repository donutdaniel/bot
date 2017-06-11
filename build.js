require('dotenv-extended').load();
var https = require('https');
var fs  = require('fs');

var options = {
    hostname: 'westus.api.cognitive.microsoft.com',
    port: 443,
    path: '/luis/v1.0/prog/apps?',
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': process.env.API_KEY,
    },
    data: 'bot_json/story1.json',
}

var req = https.request(options, function(res){
    res.on('data', (d) => {
        console.log(d.toString());
    });
});

var json = fs.readFileSync('bot_json/story1.json');
req.write(json);
req.end();