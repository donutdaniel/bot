require('dotenv-extended').load();
var https = require('https');
var fs  = require('fs');

function request(path, method, callback, data){
    var options = {
        hostname: 'westus.api.cognitive.microsoft.com',
        port: 443,
        path: path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': process.env.API_KEY,
        }
    };
    var req = https.request(options, (res) => {
        res.on('data', (d) =>{
            var dJSON = JSON.parse(d);
            if(dJSON.error != undefined){ // top level error
                throw Error(dJSON.error.message);
            }else if(dJSON.statusCode != undefined){ // general error
                console.log(dJSON.message);
                return;
            }else if(dJSON.statusCode === 429){ // timeout error, try again in one second
                setTimeout(request(path, method, callback, data), 1000);             
            }else{
                callback(d); // execute normally
            }
        });
    });
    if(method == 'POST'){
        req.write(data);
    }
    req.end();
}

/*Callback functions, with each cascading into another*/

function dummyCB(data){

}

function getAppCB(data){

}

function addAppCB(data){

}

function addIntentCB(data){

}

function addUtteranceCB(data){

}

function trainCB(data){

}

function publishCB(data){

}

/*Multi-part step to build natural language processing unit
 * returns the published url*/
function build2(structure){
    request('/luis/v1.0/prog/apps/', 'POST', addCB, data);
}

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
    var reqAddApp = https.request(options, (res) => { //todo: find existing before adding
        res.on('data', (d) => {
            var dJSON = JSON.parse(d);
            if(dJSON.error != undefined){
                console.log(d.toString());
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
                                return;
                            }else if(dJSON.statusCode === 429){
                                console.log("Adding Intent ["+key_o+"]: ERROR: " + dJSON.message);
                                return;
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
                                    var dJSON = JSON.parse(d);
                                    if(dJSON.error != undefined){
                                        console.log("Adding Utterances ["+utteranceJSON[0].exampletext+"]: ERROR:" + dJSON.error.message);
                                        return;
                                    }else if(dJSON.statusCode === 429){
                                        console.log("Adding Utterances ["+utteranceJSON[0].exampletext+"]: ERROR:" + dJSON.message);
                                        return;
                                    }else{
                                        console.log("Adding Utterances ["+utteranceJSON[0].exampletext+"]: " + d.toString());
                                    }
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

exports.build = build;
exports.delete = deleteApp;

// module.exports = build;