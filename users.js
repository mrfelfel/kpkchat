let db = require("./connect");
let Schema = db.Schema;
let users = db.model('users', new Schema({
	name: String,
  username : String,
  TelegramBotnumber : String,
	status : String,
        gender : String,
        city : String,
	partnerid : String
}));
class Users {
   insert(username,name,TelegramBotnumber){
      return users.create({
        username : username.toLowerCase(),
        name : name,
        TelegramBotnumber : TelegramBotnumber,
        status : "joined",
				partnerid : "0"
      });
   }
	 get_user(TelegramBotnumber){
		 return users.findOne({TelegramBotnumber : TelegramBotnumber}).exec();
	 }
         get_users(){
           return users.find({status : "joined", TelegramBotnumber : { $ne: null } }).exec();
         }
	 update_status(TelegramBotnumber,status){
		 return users.update({TelegramBotnumber : TelegramBotnumber}, {$set : {status : status}}).exec();
	 }
	 update_partner(TelegramBotnumber,partner){
		 return users.update({TelegramBotnumber : TelegramBotnumber}, {$set : {partnerid : partner}}).exec();
	 }
         update_gender(TelegramBotnumber,gender){
                 return users.update({TelegramBotnumber : TelegramBotnumber}, {$set : {gender : gender}}).exec();
         }
	 random_search(tid) {
     return users.count({status : "searching", TelegramBotnumber : { $ne: tid } }).exec().then(function(count){
			  if(count > 1){
                            count = count;
                          }else{
                          count = 0;
                         }
			 var rand = Math.floor(Math.random() * count);
			 return users.findOne({status : "searching", TelegramBotnumber : { $ne: tid } }).skip(rand).exec();
		 })
	 }
	}

 module.exports = new Users();

