
let TelegramBot = require('node-telegram-bot-api'),
redis = require("redis"),
token = '316798281:AAH2ssdEJzX095VXyg6cW3mk5cZ5lsq03jY',
client = redis.createClient("redis://localhost:6379/4"),
bluebird = require("bluebird"),

bot = new TelegramBot(token, {polling: true}),
users = require("./users"),
chats = require("./chat");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

function setUserLocation($uid, $location){
  client.set("location-"+$uid, $location);
}
function getUserLocation ($uid){

    return  client.getAsync("location-" + $uid);
}
function setUserStep($uid,$step){
  client.set("step-"+$uid, $step);
}
function getUserStep($uid){
  return  client.getAsync("step-" + $uid);
}
function setUserlimit($uid){
  client.set("limit-" + $uid, "limited");
  client.expireat("limit-"+$uid, parseInt((+new Date)/1000) + 60);
}
function getUserlimit($uid){
  return  client.getAsync("limit-" + $uid);
}
function incr_sign(uid){
  return client.incrAsync("signed-"+ uid);
}
function setUserblock($uid,$pid){
  client.set("blocked-" + $uid + "-" + $pid , "blocked");
}
async function getUserblock($uid,$pid){
 let result = await client.getAsync("blocked-" + $uid + "-" + $pid).then();
  if(!result){
    result = await client.getAsync("blocked-" + $pid + "-" + $uid).then();
  }
  return result;
}
bot.on('message', async (msg) => {
let from = msg.from.id;
let text = msg.text;
let userlocation;
let userOpt;
let userdet;
let userstep;
let userOmsg;
let getuserloc = await getUserLocation(msg.from.id);
let usertmplocation = getuserloc;
let userlml = await getUserlimit(msg.from.id);
 if(!getuserloc){
   usertmplocation = "home";
 }else{
   userlocation = usertmplocation;
 }
try{
   userdet = await users.get_user(from);
}catch(error){
  userdet = true;
  console.log(error);
}
function gohome(ufrom){
  userOpt = {
  reply_to_message_id: msg.message_id,
  reply_markup: JSON.stringify({
    resize_keyboard : true,
  keyboard: [
    [{text : "🔗 به یه ناشناس وصلم کن!"}],
    [{text : "مشخصات من"}, {text : "درباره بات"}, {text : "عضویت طلایی"}],
],
})
};
   userOmsg = `
   خوب چیکار باید بکنم ؟
     `;
   usertmplocation = "home";

}
try{
   userdet = await users.get_user(from);
}catch(error){
  userdet = true;
  console.log(error);
}
 //bot.sendMessage(-1001140976246, msg.text);


 switch (true) {
   case /\/start/.test(text):
   usertmplocation = "home";
   var start_loc = text.split(" ");
    if(start_loc){
     console.log("jho");
    }
   if(!userdet){
     msg.from.last_name?msg.from.last_name:"";
   users.insert(msg.from.username,msg.from.first_name,from);
   }
     break;
   case /🔗 به یه ناشناس وصلم کن!/.test(text):
     if(!userdet){
       userOmsg = "متاسفانه من هنوز تو رو نمیشناسم لطفا روی /start بزن ";
     }else{
     
   usertmplocation = "search";
      if(!userdet.gender){
      setUserStep(from,"setgender");
          userOpt = {
  reply_to_message_id: msg.message_id,
  reply_markup: JSON.stringify({
    resize_keyboard : true,
  keyboard: [
    [{text : "دخترم 👩🏻"}, {text : "پسرم👨🏻"}],
],
})
};
    userOmsg = "جنسیت خود را انتخاب کنید";
     }else{
   setUserStep(from,"main_search");
    }
     }
   break;
   case /منوی اصلی/.test(text):
   usertmplocation = "home";
   break;
   case /قطع مکالمه/.test(text):
   usertmplocation = "closechat";
   break;
   case /مشخصات من/.test(text):
   usertmplocation = "showme";
   }
    if(usertmplocation){
      setUserLocation(from,usertmplocation);
    }
   userlocation = await getUserLocation(from);

   userstep = await getUserStep(from);
   if(userlocation == "home"){
     gohome();

   }else if(userlocation == "search"){
        
      if(userstep == "main_search"){
     userOpt = {
     reply_to_message_id: msg.message_id,
     reply_markup: JSON.stringify({
       resize_keyboard : true,

     keyboard: [

       ['قطع مکالمه']
   ],
  })
   };
       
    let seus = await users.random_search(from);
    let incseus = await incr_sign(from);
    let chatfounding = false;
    
       if(!userlml){
      if(seus){
       let getuserBlock = await getUserblock(from,seus.TelegramBotnumber);
       if(!getuserBlock){
       users.update_status(msg.from.id,"chating");
       users.update_status(seus.TelegramBotnumber,"chating");
       users.update_partner(msg.from.id,seus.TelegramBotnumber);
       users.update_partner(seus.TelegramBotnumber,msg.from.id);
       userOmsg = "به یه نفر وصلت کردم باهاش چت کن ";

        bot.sendMessage(seus.TelegramBotnumber,"یافتم و وصلت کردم میتونی با مخاطب ناشناست چت کنی !");
       setUserStep(from, "input_send");
       setUserStep(seus.TelegramBotnumber, "input_send");
        chatfounding = true;
     }
     }else{
       chatfounding = false;

     }
      if(chatfounding == false){
            	 users.update_partner(msg.from.id,"no");
        users.update_status(msg.from.id,"searching");
      let partnerfounded = userdet.partnrtid;
       if((!partnerfounded) || (partnerfounded  == "no")){
       userOmsg = "لطفا صبر کنید و هیچ پیامی نفرستید .... دارم میگردم  ";
      }
      }
      }else{
         userOmsg = "هر یک دقیقه یک بار میتونی جستجو کنی !";
        }
     
   }else if(userstep == "input_send"){
     if(msg){
        let userpartner = userdet.partnerid;
         console.log(userpartner);
        if(msg.text){
             if(msg.reply_to_message){
                        bot.sendMessage(userpartner, msg.text,msg.reply_to_message);
              }else{
                      bot.sendMessage(userpartner, msg.text);
                   }
          chats.insert(msg.from.id,userpartner,msg.text);
        }else if(msg.forward_from_message_id){
         bot.forwardMessage(userpartner,msg.forward_from_chat.id, msg.forward_from_message_id, msg.text);
        }else if(msg.sticker){
         bot.sendSticker(userpartner,msg.sticker.file_id);
        }else if(msg.voice){
         bot.sendVoice(userpartner,msg.voice.file_id);
        }else if(msg.audio){
         bot.sendAudio(userpartner,msg.audio.file_id);
        }else if(msg.photo){
         bot.sendPhoto(userpartner,msg.photo[0].file_id);
        }else if(msg.document){
         bot.sendDocument(userpartner, msg.document.file_id);
        }else if(msg.video){
         bot.sendVideo(userpartner,msg.video.file_id);
        }
     }
   }else if(userstep == "setgender"){
                    console.log(msg.text);
        if(msg.text == "دخترم 👩🏻"){
         users.update_gender(from,"G");
              console.log(msg.text);
          gohome();
        }else if(msg.text == "پسرم👨🏻"){
         users.update_gender(from,"B");
                      console.log(msg.text);

          gohome();
        } 
       
    }
 }else if(userlocation == "closechat"){
   gohome();
   users.update_status(from,"joined");

      let partn = userdet.partnerid;
      if(partn != "no"){

         console.log(".....");

   users.update_status(userdet.partnerid, "joined");

    bot.sendMessage(userdet.partnerid,"مکالمه شما توسط شریکتان پایان یافت ");
    setUserLocation(userdet.partnerid, "blocking");
    userOpt = {
    reply_markup: JSON.stringify({
      resize_keyboard : true,
    keyboard: [
      [{text : "اره"}, {text : "نه"}],
  ],
  })
  };
  bot.sendMessage(userdet.partnerid,"میخوای بلاکش کنم ؟ ", userOpt);
  userOmsg = "میخوای بلاکش کنم ؟ ";
  setUserLocation(from,"blocking");
      if(!userlml){
         setUserlimit(msg.from.id);
     }
      console.log(users);

  }
}else if(userlocation == "blocking"){
   if(text == "نه"){
     users.update_partner(msg.from.id,"no");
     gohome();
   }else if(text == "اره"){
      setUserblock(msg.from.id, userdet.partnerid);
      users.update_partner(msg.from.id,"no");
      gohome();
   }
}else if(userlocation == "showme"){
      userOpt = {
     reply_to_message_id: msg.message_id,
     reply_markup: JSON.stringify({
       resize_keyboard : true,

     keyboard: [

       [{text : 'تغییر مشخصات'}],
       [{text : "منوی اصلی"}]
   ],
  })
   };
   userOmsg = `👤مشخصات شما:
  👈کد کاربری: ${userdet.id}
  👈نام: ${userdet.name}
  👈جنسیت: ${userdet.gender}
  👈عضویت: عادی`;
         //gohome();
 }
     if(userOmsg){

   bot.sendMessage(from,userOmsg,userOpt);
     }
});


 async function sendtouser(){
       let mu = await users.get_users();

       for(let i = 0; i < mu.length ; i++){
            bot.sendMessage(mu[i].TelegramBotnumber, "به کوچه پس کوچه سر نزدی ؟ پس حتما همین الان جستجو کن !");
       }
  }

   // sendtouser();

