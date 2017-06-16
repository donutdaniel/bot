require('dotenv-extended').load();
var https = require('https');
var fs  = require('fs');

/*request function for bot structure, takes care of error checking
structure: main bot structure to be built
callback: data as buffer object is passed in
data: data object as parameter, automatically converted to string in function
immediate: no data stream expected, immediately issue callback*/
function request(structure, path = '', method = 'GET', callback, data, immediate = false){
    if(arguments.length < 1){
        throw Error('BotStructure not provided.');
    }
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
        if(immediate){
            callback(structure, null);
            return;
        }
        res.on('error', () => {
            console.log('error');
        })
        res.on('data', (d) =>{
            if(d === undefined){
                callback(structure, d);
            }
            var dJSON = JSON.parse(d);
            if(dJSON.error != undefined){ // top level error
                console.log(dJSON.error);
                throw Error(dJSON.error.message);
            }else if(dJSON.statusCode != undefined){ // general error
                if(dJSON.statusCode === 429){
                    console.log('timeout');
                    setTimeout(function(){ request(path, method, callback, data) }, 1000);
                }else{
                    console.log(dJSON.message);
                    return;
                }
            }else{
                callback(structure, d); // execute normally
            }
        });
    });
    if(method === 'POST' || method === 'PUT'){
        req.write(JSON.stringify(data));
    }
    req.on('error', (e) => {
      console.error(e);
    });
    req.end();
}

/*Callback functions, with each cascading into another*/

function dummyCB(structure, data){

}

function dislpayCB(structure, data){
    console.log(data.toString());
}

/*Iterates through each existing app, matching names.
if matched, then the app is updated
if not matched, a new app is created*/
function getAppCB(structure, data){
    var appData = new Object();
    appData.name = structure.name;
    appData.description = structure.description;
    appData.culture = 'en-us';
    var path = '/luis/v1.0/prog/apps/';
    var dJSON = JSON.parse(data);
    for (var i = 0; i < dJSON.length; i++) {
        if(dJSON[i].Name === structure.name){
            // Matched
            var id = dJSON[i].ID;
            structure.id = id;
            path = path + id;
            console.log('updating');
            request(structure, path, 'PUT', updateAppCB, appData, true);
            return;
        }
    }
    // Not Matched
    console.log('adding');
    request(structure, path, 'POST', addAppCB, appData);

}

/*Assigns id to structure, then begins adding intents*/
function addAppCB(structure, data){
    var dJSON = JSON.parse(data);
    structure.id = dJSON;
    var path = '/luis/v1.0/prog/apps/' + structure.id + '/intents';
    console.log('getting intents');
    request(structure, path, 'GET', getIntentsCB);
}

function updateAppCB(structure, data){
    var path = '/luis/v1.0/prog/apps/' + structure.id + '/intents';
    console.log('getting intents');
    request(structure, path, 'GET', getIntentsCB);
}

function getIntentsCB(structure, data){ // TODO: allow for updating
    var dJSON = JSON.parse(data);
    var existingIntents = [];
    dJSON.forEach((value, index, array) => {
        existingIntents.push(value.name);
    });
    var path = '/luis/v1.0/prog/apps/' + structure.id;
    var utterancesData = [];
    structure.segments.forEach((value_s, key_s, map_s) => {
        value_s.options.forEach((value_o, key_o, map_o) => {
            // Check for duplicates and add
            if(existingIntents.find((element, index, array) => { return element === key_o; }) === undefined){
                console.log('adding intent');
                existingIntents.push(key_o);
                var intentData = new Object();
                intentData.name = key_o;
                request(structure, path + '/intents', 'POST', addIntentCB, intentData);
            }
            for (var i = 0; i < value_o.triggers.length; i++) {
                utterancesData.push({selectedintentName: key_o, exampletext: value_o.triggers[i]});
            }
        });
    });
    console.log('adding utterances');
    request(structure, path + '/examples', 'POST', addUtterancesCB, utterancesData);
}

function addIntentCB(structure, data){
// Add all the utterances
    // var path = '/luis/v1.0/prog/apps/' + structure.id;
    // structure.segments.forEach((value_s, key_s, map_s) => {
    //     value_s.options.forEach((value_o, key_o, map_o) => {
    //         // add utterances in batches
    //         var utterancesData = [{"selectedintentname": key_o}];
    //         for(var i = 0; i < value_o.triggers.length; i++){
    //             var exampletextObj = new Object();
    //             exampletextObj.exampletext = value_o.triggers[i];
    //             utterancesData.push(exampletextObj);
    //         }
    //         console.log(JSON.stringify(utterancesData));
    //         request(structure, path + '/examples', 'POST', addUtterancesCB, utterancesData);
    //     });
    // });
}

function addUtterancesCB(structure, data){

}

function trainCB(structure, data){

}

function publishCB(structure, data){

}

/*Multi-part step to build natural language processing unit
 * returns the published url*/
function build(structure){
    var path = '/luis/v1.0/prog/apps'
    if(structure.id === undefined){
        request(structure, path, 'GET', getAppCB); 
    }else{
        var appData = new Object();
        appData.name = structure.name;
        appData.description = structure.description;
        appData.culture = 'en-us';
        console.log('updating');
        request(structure, path + structure.id, 'PUT', updateAppCB, appData);
    }

}

/*Multi-part step to build natural language processing unit
returns the published url*/
function build_old(structure){
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