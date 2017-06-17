require('dotenv-extended').load();
var https = require('https');
var fs  = require('fs');
var events = require('events');
var eventEmitter = new events();
var universalPath = '/luis/api/v2.0/apps/';

/*request function for bot structure, takes care of error checking
structure: main bot structure to be built
callback: data as buffer object is passed in
data: data object as parameter, automatically converted to string in function
immediate: no data stream expected, immediately issue callback*/
function request(structure, path = '', method = 'GET', callback = dummyCB, data = null, immediate = false){
    if(arguments.length < 1){
        throw Error("BotStructure not provided.");
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
            var dJSON = JSON.parse(d);
            if(dJSON === null || dJSON === undefined){
                callback(structure, d);
            }else if(dJSON.error != undefined){ // top level error
                console.log(dJSON.error);
                throw Error(dJSON.error.message);
            }else if(dJSON.statusCode != undefined){ // general error
                if(dJSON.statusCode === 429){
                    console.log("Timeout Error. Will try again in 1 second.");
                    setTimeout(request, 1000, structure, path, method, callback, data, immediate);
                }else{
                    console.log(dJSON.message);
                    return;
                }
            }else{
                callback(structure, d); // execute normally
            }
        });
    });
    if(data != null || data != undefined){
        req.write(JSON.stringify(data));
    }
    req.on('error', (e) => {
      console.error(e);
    });
    req.end();
}

/*Callback functions, with each cascading into another*/
function dummyCB(structure, data){
    // do nothing
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
    var path = universalPath;
    var dJSON = JSON.parse(data);
    for (var i = 0; i < dJSON.length; i++) {
        if(dJSON[i].name === structure.name){
            // Matched
            var id = dJSON[i].id;
            structure.id = id;
            path = path + id;
            if(dJSON[i].endpoints.PRODUCTION.assignedEndpointKey === ""){
                console.log("Assigning Subscription Key");
                request(structure, path, 'PUT', dummyCB, process.env.SUBSCRIPTION_KEY, true);
            }
            console.log("Updating App: " + structure.name);
            request(structure, path, 'PUT', updateAppCB, appData, true);
            return;
        }
    }
    // Not Matched
    appData.initialVersionId = structure.version;
    console.log("Creating New App: " + structure.name);
    request(structure, path, 'POST', addAppCB, appData);

}

/*Assigns id to structure, then begins adding intents*/
function addAppCB(structure, data){
    var dJSON = JSON.parse(data);
    structure.id = dJSON;
    var path = universalPath + structure.id + '/versions/' + structure.version + '/intents';
    console.log("Retrieving Intents List");
    request(structure, path, 'GET', getIntentsCB);
    console.log("Assigning Subscription Key");
    request(structure, path, 'PUT', dummyCB, process.env.SUBSCRIPTION_KEY, true);
}

function updateAppCB(structure, data){
    var path = universalPath + structure.id + '/versions/' + structure.version + '/intents';
    console.log("Retrieving Intents List");
    request(structure, path, 'GET', getIntentsCB);
}

function getIntentsCB(structure, data){ // TODO: allow for updating
    var path = universalPath + structure.id + '/versions/' + structure.version;
    var dJSON = JSON.parse(data);
    var existingIntents = [];
    dJSON.forEach((value, index, array) => {
        existingIntents.push(value.name);
    });
    var examplesData = [];
    // helper variables to make sure process of adding intents has finished
    var intentsAddedSum = 0;
    var totalNewIntents = 0;
    structure.segments.forEach((value_s, key_s, map_s) => {
        value_s.options.forEach((value_o, key_o, map_o) => {
            // Check for duplicates and add in batch
            if(existingIntents.find((element, index, array) => { return element === key_o; }) === undefined){
                totalNewIntents++;
                existingIntents.push(key_o);
                var intentData = new Object();
                intentData.name = key_o;
                console.log("Adding Intent:" + key_o);
                request(structure, path + '/intents', 'POST', addIntentCB, intentData);
            }
            for (var i = 0; i < value_o.triggers.length; i++) {
                examplesData.push({intentName: key_o, text: value_o.triggers[i]});
            }
        });
    });
    if(totalNewIntents === 0){
        console.log("Batch Adding Labelled Examples");
        request(structure, path + '/examples', 'POST', addBatchLabelsCB, examplesData);
    }
    eventEmitter.on("intentAdded", function(){
        intentsAddedSum++;
        if(intentsAddedSum === totalNewIntents){
            console.log("Batch Adding Labelled Examples");
            request(structure, path + '/examples', 'POST', addBatchLabelsCB, examplesData);
        }
    });
}

function addIntentCB(structure, data){
    // Triggers adding batch labels
    eventEmitter.emit("intentAdded");
}

function addBatchLabelsCB(structure, data){
    var path = universalPath + structure.id + '/versions/' + structure.version;
    var dJSON = JSON.parse(data);
    for (var i = 0; i < dJSON.length; i++) {
        if(dJSON[i].hasError){
            console.log('Error adding: ' + dJSON[i].error.message);
        }
    }
    console.log("Training App");
    request(structure, path + '/train', 'POST', trainCB, null, true);
}

function trainCB(structure, data){
    var path = universalPath + structure.id + '/versions/' + structure.version;
    console.log("Getting App Training Status");
    request(structure, path + '/train', 'GET', trainStatusCB);
}

function trainStatusCB(structure, data){
    var path = universalPath + structure.id + '/versions/' + structure.version;
    var dJSON = JSON.parse(data);
    var statusId;
    for (var i = 0; i < dJSON.length; i++){
        statusId = dJSON[i].details.statusId;
        if(statusId === 1){
            console.log("Training for model " + dJSON[i].modelId + " has failed due to " + dJSON[i].details.failureReason);
        }
        if(statusId === 3){
            console.log("Training Status: One or more models are still in progress...")
            setTimeout(request, 1000, structure, path + '/train', 'GET', trainStatusCB);
            return;
        }
    }
    var publishData = new Object();
    publishData.versionId = structure.version;
    publishData.isStaging = false;
    console.log("Training Status: Done!");
    request(structure, universalPath + structure.id + '/publish', 'POST', publishCB, publishData);
}

function publishCB(structure, data){
    var dJSON = JSON.parse(data);
    var url = dJSON.endpointUrl + '?subscription-key=' + dJSON.assignedEndpointKey + '&timezoneOffset=0&verbose=true&q='
    console.log(url);
}

/*Multi-part step to build natural language processing unit
 * returns the published url*/
function build(structure){
    if(structure.id === undefined){
        console.log("Retrieving App List");
        request(structure, universalPath, 'GET', getAppCB); 
    }else{
        var appData = new Object();
        appData.name = structure.name;
        appData.description = structure.description;
        appData.verion = structure.version;
        appData.culture = 'en-us';
        console.log("Updating App: " + structure.name);
        request(structure, universalPath + structure.id, 'PUT', updateAppCB, appData);
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