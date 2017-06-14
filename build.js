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
            var dJSON = JSON.parse(d);
            if(dJSON.error != undefined){
                throw Error(dJSON.error.message);
            }else{
                console.log("Adding App: " + d.toString());
            }
            appID = d.toString().replace(/"/g, "");
            uPath = '/luis/v1.0/prog/apps/' + appID;
            optionsPath = [uPath+'/intents', uPath+'/examples', uPath+'/train', uPath+'/publish'];

            // create intents
            structure.segments.forEach((value, key, map) => {
                value.options.forEach((value_o, key_o, map_o) => {
                    options.path = optionsPath[0];
                    var reqAddIntent = https.request(options, (res) => {
                        res.on('data', (d) => {  
                            var dJSON = JSON.parse(d);
                            if(dJSON.error != undefined){
                                console.log("Adding Intent ["+key_o+"]: ERROR: " + dJSON.error.message); 
                            }else{
                                console.log("Adding Intent ["+key_o+"]: " + d.toString());
                            }

                            // add utterances in batches
                            var utteranceJSON = [{"selectedintentname": key_o}];
                            for(var i = 0; i < value_o.triggers.length; i++){
                                var exampletextObj = new Object();
                                exampletextObj.exampletext = value_o.triggers[i];
                                utteranceJSON.push(exampletextObj);
                            }
                            options.path = optionsPath[1];
                            var reqAddExamples = https.request(options, (res) => {
                                res.on('data', (d) => {
                                    console.log("Adding Utterances ["+utteranceJSON[0].exampletext+"]: " + d.toString());
                                });
                            });
                            reqAddExamples.write(JSON.stringify(utteranceJSON));
                            reqAddExamples.end();
                        });
                    });
                    var intentJSON = {
                        "name": key_o
                    }
                    reqAddIntent.on('error', (e) => {
                        console.error("problem with request:" + e.toString());
                    });
                    reqAddIntent.write(JSON.stringify(intentJSON));
                    reqAddIntent.end();
                });
            });

            // train
            // options.path = optionsPath[2];
            // https.request(options, (res) => {
            //     res.on('data', (d) => {
            //         console.log("Training: " + d.toString());
            //     });
            //     // publish
            //     options.path = optionsPath[3];
            //     https.request(options, (res) =>{
            //         res.on('data', (d) => {
            //             var url = d[0].toString() + '?subscription-key=' + d[1].toString() + '&timezoneOffset=0&verbose=true&q=';
            //             console.log("Publishing: " + d.toString());
            //             console.log(url);
            //             return url;
            //         });
            //     }).end();
            // }).end();
        });
    });
    var appJSON = {
        "name": structure.name,
        "description": structure.description,
        "culture": "en-us"
    }
    reqAddApp.on('error', (e) => {
        console.error("problem with request:" + e.toString());
    });
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
    }).end();
}

// var options1 = {
//     hostname: 'westus.api.cognitive.microsoft.com',
//     port: 443,
//     path: '/luis/v1.0/prog/apps/79a1aa4a-cea8-4626-b29b-77f69f3428bf/intents',
//     method: 'POST',
//     headers: {
//         'Ocp-Apim-Subscription-Key': process.env.API_KEY,
//     }
// };
// var testjson = {
//     "name": "testintent"
// }
// var reqtest = https.request(options1, (res) => {
//     res.on('data', (d) => {
//         console.log(d.toString());
//     });
// });
// reqtest.write(JSON.stringify(testjson));
// reqtest.end();

exports.build = build;
exports.delete = deleteApp;

// module.exports = build;