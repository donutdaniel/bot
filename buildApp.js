require('dotenv-extended').load();
var https = require('https');
var fs  = require('fs');
var events = require('events');
var emitter = new events();
var universalPath = '/luis/api/v2.0/apps/';

/*buildApp takes a structure and returns a url containing the luis app*/

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
    emitter.on("intentAdded", function(){
        intentsAddedSum++;
        if(intentsAddedSum === totalNewIntents){
            console.log("Batch Adding Labelled Examples");
            request(structure, path + '/examples', 'POST', addBatchLabelsCB, examplesData);
        }
    });
}

function addIntentCB(structure, data){
    // Triggers adding batch labels
    emitter.emit("intentAdded");
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
    console.log("Publishing");
    request(structure, universalPath + structure.id + '/publish', 'POST', publishCB, publishData);
}

function publishCB(structure, data){
    var dJSON = JSON.parse(data);
    var url = dJSON.endpointUrl + '?subscription-key=' + dJSON.assignedEndpointKey + '&timezoneOffset=0&verbose=true&q='
    console.log("Endpoint Url: " + url);
    exports.url = url;
    emitter.emit('done', url);
}

/*Multi-part step to build natural language processing unit
 * returns the published url*/
function buildApp(structure){
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

function deleteApp(appId){
    var options = {
        hostname: 'westus.api.cognitive.microsoft.com',
        port: 443,
        path: universalPath + appId,
        method: 'DELETE',
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.API_KEY,
        }
    };
    console.log("Deleting App: " + appId)
    https.request(options, (res) => {
        console.log("Successfully Deleted");
    }).end();
}
exports.request = request;
exports.emitter = emitter;
exports.url = undefined;
exports.build = buildApp;
exports.deleteApp = deleteApp;