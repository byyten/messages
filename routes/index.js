var express = require('express');
var router = express.Router();
var mongoose = require("mongoose")


const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs")
const { body, validator } = require("express-validator")

const Message = require("../models/message")
const Attachment = require("../models/attachment")
const User = require("../models/user")


passport.use(
  new LocalStrategy(async (anom, password, done) => {
    try {
      const user = await User.findOne({ anom: anom });
      if (!user) {
        return done(null, false, { message: "Incorrect username or password" });
      };

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: "Incorrect password or username" })
      }
      // if (user.password !== password) {
      //   return done(null, false, { message: "Incorrect password" });
      // };
      return done(null, user);
    } catch(err) {
      return done(err);
    };
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch(err) {
    done(err);
  };
});

router.use(session({ secret: "dogs", resave: false, saveUninitialized: true }));
router.use(passport.initialize());
router.use(passport.session());

router.use((req, res, next) => {
  res.locals.user = req.user ;
  next();
});

async function check_password(type, input_password) {
  let hashed_password = await Club.findOne({type: type}).exec()
  let match = await bcrypt.compare(input_password, hashed_password.password);
  return match
}

/* GET users listing. */
// router.get('/login', (req, res) => {
//   res.render('signin', {title: "Messengineering"});
// });
// router.post('/login', 
//   passport.authenticate("local", {
//     successRedirect: "/somewhere",
//     failureRedirect: "/login"
//   })
// )

router.get("/login", (req, res) => {
  res.render("signin", {title:"Messengineering"})
});

router.post("/login", 
  passport.authenticate("local", {
    successRedirect: "/messages",
    failureRedirect: "/login"
  })
)

router.get('/register', function(req, res, next) {
  res.render('register', {title: "Messengineering Register"});
});

router.post('/register', async (req, res, next) => {
  console.log('process signin');
  body("email").custom(async value => {
    const user = await User.findOne({ email: value} ).exec();
    if (user) {
      // throw new Error('E-mail already in use');
      res.render("register", {title: "Messengineering Register",  errors: [`email ${value} is already registered`]})
    }
  }),
  body('password').isLength({ min: 8 }),
  body('confirm').custom((value, { req }) => {
    return value === req.body.password;
  })
  // on success  res.redirect("/messageboard");
  // res.send(404);
  bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
    if(err) {
      res.redirect("/register");
    }
    // if err, do something
    // otherwise, store hashedPassword in DB
    try {
      const user = new User({
        email: req.body.email,
        anom: req.body.anom,
        password: hashedPassword,
        forename: req.body.forename,
        surname: req.body.surname,
      });
      const result = await user.save();
      console.log("registered\n" + result);
      let messages = await Message.find().exec()
      // res.render("messageboard", {messages: messages, user: req.user, club: req.user.club, admin: req.user.admin })
      // res.render("/", {title: "Post-a-Note Register", messages: messages, user: req.user ? req.user: false, club: req.user ? req.user.club: false, admin:req.user ? req.user.admin : false })
      res.render("index")
      // res.redirect("/messageboard");
    } catch(err) {
      return next(err);
    };
  })  
});

// logout done
router.post('/logout', async (req, res, next) => {
  console.log('process signout');
  req.logout((err) => {
    if (err) {
      return next(err);
    }
  })
  res.redirect("/")
  
  // res.render("index", {title: "Messengineering Signoff", user: null});

});

router.get('/reset', function(req, res, next) {
  res.render('reset_password');
});

router.post("/reset", async (req, res) => {
      try {
        let account = await User.findOne({ email: req.body.email })
        let verify_old_password = await bcrypt.compare(req.body.oldpassword, account.password)
        if (verify_old_password) {

            req.body.password = await bcrypt.hash(req.body.password, 10)
            // req.body.new_password = await bcrypt.hash(req.body.new_password, salt_length)
            let find_result = await User.findOneAndUpdate({ email: req.body.email },{ $set: { password: req.body.password }})
            res.redirect("/messages")
            // res.json({ op: "post / resetpassword find + update", status: 200, result: find_result, authentication_data: authentication_data})    
        } else {
            res.redirect("/reset_password")
            // res.json({ op: "reset password", status: 401, result: "incorrect data"})
        }
    } catch (err) {
      res.redirect("/")
    }    
})

router.get('/unregister', function(req, res, next) {
  res.render('unregister');
});

router.post("/unregister", async (req, res, next) => {
  // comapare password
  check_user = await User.findOne({ email: req.body.email })
  match = await bcrypt.compare(req.body.password, check_user.password)
  if (match) {
    try {
      
      let hashed = await bcrypt.hash("disabled_account_" + req.body.password, 10)
      unreg_resp = await User.findOneAndUpdate({ email: req.body.email },{ $set: {
        email: "disabled_" + req.body.email,
        password: hashed,
        active: false
      }})

      res.redirect("/")        
    } catch (err) {
      next(err)
    }
  }
})

/*

require("dotenv").config();
const mongodb = process.env.MONGODB_URI;

const mongoose = require("mongoose");
mongoose.connect(mongodb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

Message = require("./models/message");
Attachment = require("./models/attachment");
User = require("./models/user");

*/


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: "messi engerineeerin" });
});

router.get('/messages', function(req, res, next) {
  if (req.user) {
    res.render('messages', { title: "messi engerineeerin" });
  } else {
    res.redirect("/login")
  }
});

router.get("/api/v1/members", async (req, res) => {
  try {
    let members = await User.find({ active: true }, { anom: 1, email: 1, avatar: 1 })
    res.json(members)
  } catch (err) {
    res.json({op: "api/v1/members", status: 500, result: err })
  }
})

router.post("/api/v1/send_message", async (req, res) => {
  console.log(req.body)
  // handles responses
  process_inbound_message(req, res) 

  // res.json({op: "sendmessage", status: 200, result: "yet to implement backend"})
} )

router.post("/api/v1/messages", async (req, res) => {
  try {
    if (req.body.sender && !req.body.recipient) {
      // req = { body: { sender: "6539dd1f519e674d8c890354"}}
      let messages = await Message.find({ $or: [{sender: req.body.sender}, { recipient: { $in: [req.body.sender]}}]  }).populate("recipient").populate("attachments")
      res.json(messages)
    } else if (!req.body.sender && req.body.recipient) {
      let messages = await Message.find({sender: req.body.recipient }).populate("sender").populate("attachments")
      res.json(messages)
    } else {
      let messages = await Message.find({
        sender: { $in: [req.body.sender, req.body.recipient ]}, 
        recipient: { $in: [req.body.sender, req.body.recipient ]}
      }).populate("sender").populate("recipient").populate("attachments")
      res.json(messages)
    }
  } catch (err) {
    res.json({op: "api/v1/messages", status: 500, result: err })
  }
})

router.post("/api/v1/update_profile", async (req, res) => {
  try {
    upd_res = await User.findOneAndUpdate({ _id: req.body._id },{ $set: { [req.body.key]: req.body.value }} )
    if (upd_res) {
      res.json({ op: "update profile", status: 200, result: upd_res })
    }
  } catch (err) {
    res.json({ op: "update profile", status: 500, result: err })
  }
})

const process_inbound_message = async (req, res) => {
    let m_id = new mongoose.Types.ObjectId();

    try {
        let attached = req.body.attachments.map(att => {
            return new Attachment({
                _id: new mongoose.Types.ObjectId(),
                payload: att.payload,
                filename: att.filename,
                size: att.size,
                type: att.type,
                message: m_id
            })
        })
            
        let message = new Message({
            _id: m_id,
            timestamp: req.body.timestamp,
            sender: new mongoose.Types.ObjectId(req.body.sender),
            recipient: req.body.recipient.map(r => new mongoose.Types.ObjectId(r)),
            payload: req.body.payload,
            attachments: attached.map(att => (att._id))
        })
        save_res = await message.save()
        results = [save_res]
        if (save_res) {
            for (attachment of attached) {
                save_att_res = await attachment.save()
                console.log(save_att_res)
                results.push(save_att_res)
            }        
        }    
        res.json({ op:"save message + attached", status: 200, results: results} )
    } catch (err) {
        console.log(err)
        res.json({op: "save_message / attach", status: 500, result: err })
    }

    
}

module.exports = router;
