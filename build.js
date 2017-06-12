require('dotenv-extended').load();
var https = require('https');
var fs  = require('fs');

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

/*Multi-part step to build natural language processing unit
returns the published url*/
function build(structure){
    var appID, uPath, optionsPath;

    // add app
    options.path = '/luis/v1.0/prog/apps/';
    var reqAddApp = https.request(options, (res) => {
        res.on('data', (d) => {
            appID = d.toString();
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
                    // add utterances
                    for(var i = 0; i < value_o.triggers.length; i++){
                        var utteranceJSON = {
                            "exampletext": value_o.triggers[i],
                            "selectedintentname": key_o
                        }
                        optionsPath = optionsPath[1];
                        https.request(options).end();
                    }
                });
                reqAddIntent.write(JSON.stringify(intentJSON));
                reqAddIntent.end();
            });
        });

        // train    

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

}

exports.build = build();
exports.delete = deleteApp();