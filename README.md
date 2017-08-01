# botbot

### parsing: txt has to be be in this specific format  
see /structure_files for example  
  
  
Necessary .env vars:  
PORT  
MICROSOFT_APP_ID  
MICROSOFT_APP_PASSWORD  
LUIS_URL  
API_KEY  

### Long-term TODO:
* Interface story (structure) creation
* Export to some kind of mobile app
* better stories

### BOT TODO:
* get rid of choices text, escape chars cause errors
* better language understanding (including regex understanding)
* ability to choose story to begin with (should preload all stories on deploy? have to do it everytime a new one is added or changed)

###	SERVER TODO
* connect sql requests with actual saved stories
* build the create page
* nicer interface

### ISSUES:
* session.userData.current stores id, so each time proceed is called the structure searches for the segment again (inefficient).

### NOTES:
* site uses bot id as identifier (e.g. /:id)