require('dotenv-extended').load();
var https = require('https');
var fs  = require('fs');
var events = require('events');
var emitter = new events();
var universalPath = '/luis/api/v2.0/apps/';

/*buildApp takes a story and returns a url containing the luis app*/

/*request function for bot story, takes care of error checking
story: main bot story to be built
callback: data as buffer object is passed in
data: data object as parameter, automatically converted to string in function
immediate: no data stream expected, immediately issue callback*/
function request(story, path = '', method = 'GET', callback = dummyCB, data = null, immediate = false){
    if(arguments.length < 1){
        throw Error("Botstory not provided.");
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
            callback(story, null);
            return;
        }
        res.on('error', () => {
            console.log('error');
        })
        res.on('data', (d) =>{
            var dJSON = JSON.parse(d);           
            if(dJSON === null || dJSON === undefined){
                callback(story, d);
            }else if(dJSON.error != undefined){ // top level error
                console.log(dJSON.error);
                console.log(JSON.stringify(data));
                throw Error(dJSON.error.message);
            }else if(dJSON.statusCode != undefined){ // general error
                if(dJSON.statusCode === 429){
                    console.log("Timeout Error. Will try again in 1 second.");
                    setTimeout(request, 1000, story, path, method, callback, data, immediate);
                }else{
                    console.log(dJSON.message);
                    return;
                }
            }else{
                callback(story, d); // execute normally
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
function dummyCB(story, data){
    // do nothing
}

function displayCB(story, data){
    if(data != null){
        console.log(data.toString());
    }
}

/*Iterates through each existing app, matching names.
if matched, then the app is updated
if not matched, a new app is created*/
function getAppCB(story, data){
    var appData = new Object();
    appData.name = story.name;
    appData.description = story.description;
    appData.culture = 'en-us';
    var path = universalPath;
    var dJSON = JSON.parse(data);
    for (var i = 0; i < dJSON.length; i++) {
        if(dJSON[i].name === story.name){
            // Matched
            var id = dJSON[i].id;
            story.id = id;
            story.version = dJSON[i].endpoints.PRODUCTION.versionId;
            path = path + id;
            if(dJSON[i].endpoints.PRODUCTION.assignedEndpointKey === ""){
                console.log("Assigning Subscription Key");
                request(story, path + '/versions/' + story.version + '/assignedkey', 'PUT', displayCB, process.env.SUBSCRIPTION_KEY);
            }
            console.log("Updating App: " + story.name);
            request(story, path, 'PUT', updateAppCB, appData, true);
            return;
        }
    }
    // Not Matched
    appData.initialVersionId = story.version;
    console.log("Creating New App: " + story.name);
    request(story, path, 'POST', addAppCB, appData);

}

/*Assigns id to story, then begins adding intents*/
function addAppCB(story, data){
    var dJSON = JSON.parse(data);
    story.id = dJSON;
    var path = universalPath + story.id + '/versions/' + story.version;
    console.log("Retrieving Intents List");
    request(story, path + '/intents', 'GET', getIntentsCB);
    console.log("Assigning Subscription Key");
    request(story, path + '/assignedkey', 'PUT', dummyCB, process.env.SUBSCRIPTION_KEY);
}

function updateAppCB(story, data){
    var path = universalPath + story.id + '/versions/' + story.version + '/intents';
    console.log("Retrieving Intents List");
    request(story, path, 'GET', getIntentsCB);
}

function getIntentsCB(story, data){ // TODO: allow for updating
    var path = universalPath + story.id + '/versions/' + story.version;
    var dJSON = JSON.parse(data);
    var existingIntents = [];
    dJSON.forEach((value, index, array) => {
        existingIntents.push(value.name);
    });
    var examplesData = [];
    // helper variables to make sure process of adding intents has finished
    var intentsAddedSum = 0;
    var totalNewIntents = 0;
    story.optionslist.forEach((value, key, map) => {
        // Check for duplicates and add in batch
        if(existingIntents.find((element, index, array) => { return element === key; }) === undefined){
            totalNewIntents++;
            existingIntents.push(key);
            var intentData = new Object();
            intentData.name = key;
            console.log("Adding Intent:" + key);
            request(story, path + '/intents', 'POST', addIntentCB, intentData);
        }
        for(var i = 0; i < value.length; i++){
            examplesData.push({intentName: key, text: value[i]});
        }
    });
    if(totalNewIntents === 0){
        console.log("Batch Adding Labelled Examples");
        request(story, path + '/examples', 'POST', addBatchLabelsCB, examplesData);
    }
    emitter.on("intentAdded", function(){
        intentsAddedSum++;
        if(intentsAddedSum === totalNewIntents){
            console.log("Batch Adding Labelled Examples");
            request(story, path + '/examples', 'POST', addBatchLabelsCB, examplesData);
        }
    });
}

function addIntentCB(story, data){
    // Triggers adding batch labels
    emitter.emit("intentAdded");
}

function addBatchLabelsCB(story, data){
    var path = universalPath + story.id + '/versions/' + story.version;
    var dJSON = JSON.parse(data);
    for (var i = 0; i < dJSON.length; i++) {
        if(dJSON[i].hasError){
            console.log('Error adding: ' + dJSON[i].error.message);
        }
    }
    console.log("Training App");
    request(story, path + '/train', 'POST', trainCB, null, true);
}

function trainCB(story, data){
    var path = universalPath + story.id + '/versions/' + story.version;
    console.log("Getting App Training Status");
    request(story, path + '/train', 'GET', trainStatusCB);
}

function trainStatusCB(story, data){
    var path = universalPath + story.id + '/versions/' + story.version;
    var dJSON = JSON.parse(data);
    var statusId;
    for (var i = 0; i < dJSON.length; i++){
        statusId = dJSON[i].details.statusId;
        if(statusId === 1){
            console.log("Training for model " + dJSON[i].modelId + " has failed due to " + dJSON[i].details.failureReason);
        }
        if(statusId === 3){
            console.log("Training Status: One or more models are still in progress...")
            setTimeout(request, 1000, story, path + '/train', 'GET', trainStatusCB);
            return;
        }
    }
    var publishData = new Object();
    publishData.versionId = story.version;
    publishData.isStaging = false;
    console.log("Training Status: Done!");
    console.log("Publishing");
    request(story, universalPath + story.id + '/publish', 'POST', publishCB, publishData);
}

function publishCB(story, data){
    var dJSON = JSON.parse(data);
    var url = dJSON.endpointUrl + '?subscription-key=' + dJSON.assignedEndpointKey + '&timezoneOffset=0&verbose=true&q='
    console.log("Endpoint Url: " + url);
    exports.url = url;
    emitter.emit('done', url);
}

/*Multi-part step to build natural language processing unit
 * returns the published url*/
function buildApp(story){
    if(story.id === undefined){
        console.log("Retrieving App List");
        request(story, universalPath, 'GET', getAppCB); 
    }else{
        var appData = new Object();
        appData.name = story.name;
        appData.description = story.description;
        appData.verion = story.version;
        appData.culture = 'en-us';
        console.log("Updating App: " + story.name);
        request(story, universalPath + story.id, 'PUT', updateAppCB, appData, true);
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