let db = require("./connect");
let Schema = db.Schema;
let chats = db.model('chats', new Schema({
  from : String,
  to : String,
  chat : String
}));
class Chats {
   insert(from,to,chat){
      return chats.create({
        from : from,
        to : to,
        chat : chat
      });
   }

	}

 module.exports = new Chats();

