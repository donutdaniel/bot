require('dotenv-extended').load();
var https = require('https');
var fs  = require('fs');

/*Multi-part step to build natural language processing unit
returns the published url*/
function build(structure){
    var options = {
        hostname: 'westus.api.cognitive.microsoft.com',
        port: 443,
        path: '/luis/v1.0/prog/apps/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': process.env.API_KEY,
        }
    };
    var appID, uPath, optionsPath;

    // add app
    options.path = '/luis/v1.0/prog/apps/';
    var reqAddApp = https.request(options, (res) => {
        res.on('data', (d) => {
            appID = d.toString();
console.log("Adding App: " + d.toString());
        });
        uPath = '/luis/v1.0/prog/apps/' + appID;
        optionsPath = [uPath+'/intents', uPath+'/example', uPath+'/train', uPath+'/publish'];

        // create intents
        structure.segments.forEach((value, key, map) => {
            value.options.forEach((value_o, key_o, map_o) => {
                var intentJSON = {
                    "name": key_o
                }
                options.path = optionsPath[0];
                var reqAddIntent = https.request(options, (res) => {
res.on('data', (d) => {
    console.log("Adding Intent ["+key_o+"]: " + d.toString());
});
                    // add utterances
                    for(var i = 0; i < value_o.triggers.length; i++){
                        var utteranceJSON = {
                            "exampletext": value_o.triggers[i],
                            "selectedintentname": key_o
                        }
                        options.path = optionsPath[1];
                        var reqAddExample = https.request(options, (res) => {
res.on('data', (d) => {
    console.log("Adding Utterance ["+value_o.triggers[i]+"]: " + d.toString());
});
                        });
                        reqAddExample.write(JSON.stringify(utteranceJSON));
                        reqAddExample.end();
                    }
                });
                reqAddIntent.write(JSON.stringify(intentJSON));
                reqAddIntent.end();
            });
        });

        // train
        options.path = optionsPath[2];
        https.request(options, (res) => {
res.on('data', (d) => {
    console.log("Training: " + d.toString());
});
            options.path = optionsPath[3];
            https.request(options, (res) =>{
                res.on('data', (d) => {
                    var url = d[0].toString() + '?subscription-key=' + d[1].toString() + '&timezoneOffset=0&verbose=true&q=';
console.log("Publishing: " + d.toString());
                    console.log(url);
                    return url;
                });
            }).end();
        }).end();

    // publish
    });
    var appJSON = {
        "name": structure.name,
        "description": structure.description,
        "culture": "en-us"
    }
    reqAddApp.write(JSON.stringify(appJSON));
    reqAddApp.end();
}

function deleteApp(appID){
    var options = {
        hostname: 'westus.api.cognitive.microsoft.com',
        port: 443,
        path: '/luis/v1.0/prog/apps/' + appID,
        method: 'DELETE',
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.API_KEY,
        }
    };
    https.request(options, (res) => {
        res.on('data', (d) => {
            console.log(d.toString());
        });
    })
}

exports.build = build;
exports.delete = deleteApp;

// module.exports = build;