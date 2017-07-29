var crypto = require('crypto');

module.exports = function(data){
	var sha256 = crypto.createHash('sha256');
	sha256.update(data);
	return sha256.digest('hex');
}