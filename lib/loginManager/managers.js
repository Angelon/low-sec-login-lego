var     Backbone = require("backbone"),
        _ = require("underscore")
        mongoose = require('mongoose'),
        http =        require('http'),
        crypto = require('crypto'),
        nodemailer = require("nodemailer"),
        opts = { server: { auto_reconnect: false }, user: 'database-user-name', pass: 'database-password' },
        db = mongoose.createConnection('localhost', 'databasename', 27017, opts),
        models = require("./models");

var User;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (){
  console.log("DB Connection Open");
  User = db.model('User', models.schemas.User);
});

var UserManager = function(){

};

UserManager.prototype = {
        init:function(){
                this.setUpRouter();
        },

        getMyName : function(){
        	return "UserManager";
        },
        
        getPatronItem : function(){
            return User;
        },

        setUpRouter:function(){
                var self = this;
                this.router = {};
                _.extend(this.router, Backbone.Events);

                this.router.on('findItem', function(req, res){
                        console.log(self.getMyName() + ".router.findItem");
                        var data = req.body;
                    self.findOrCreateItem(data, function(err, item){
                            console.log(self.getMyName() + ".router.findItem.callback");
                            var responseData = {};

                            if(err){
                                    responseData.success = false;
                                    responseData.err = err;
                            }
                            else{
                                    responseData.success = true;
                                    responseData.item = item;
                            }

                            res.end(JSON.stringify(responseData));
                    });
                });

                this.router.on('addItem', function(req, res){
                        console.log(self.getMyName() + ".router.addItem");
                        var data = req.body;
                    self.createNewItem(data, function(err, newItem){
                            console.log(self.getMyName() + ".router.addItem.callback");
                            var responseData = {};

                            if(err){
                                    responseData.success = false;
                                    responseData.err = err;
                            }
                            else{
                                    responseData.success = true;
                                    responseData.item = newItem;
                            }

                            res.end(JSON.stringify(responseData));
                    });
                });

                this.router.on('editItem', function(req, res){
                        console.log(self.getMyName() + ".router.editItem");
                        var data = req.body;
                    self.updateItem(data, function(err, newItem){
                            console.log(self.getMyName() + ".router.editItem.callback");
                            var responseData = {};

                            if(err){
                                    responseData.success = false;
                                    responseData.err = err;
                            }
                            else{
                                    responseData.success = true;
                            }

                            res.end(JSON.stringify(responseData));
                    });
                });

                this.router.on('deleteItem', function(req, res){
                        console.log(self.getMyName() + ".router.deleteItem");
                        var data = req.body;
                    self.deleteItem(data, function(err, success){
                            console.log(self.getMyName() + ".router.deleteItem.callback");
                            var responseData = {};

                            if(err){
                                    responseData.success = false;
                                    responseData.err = err;
                            }
                            else{
                                    responseData.success = true;
                            }

                            res.end(JSON.stringify(responseData));
                    });
                });

                this.router.on('changeUserPassword', function(req, res){
                        console.log(self.getMyName() + ".router.changeUserPassword");
                        var data = req.body;
                    self.changeUserPassword(data, function(err, success){
                            console.log(self.getMyName() + ".router.changeUserPassword.callback");
                            var responseData = {};

                            if(err){
                                    responseData.success = false;
                                    responseData.err = err;
                            }
                            else{
                                    responseData.success = true;
                            }

                            res.end(JSON.stringify(responseData));
                    });
                });

                this.router.on('generatePasswordResetCode', function(req, res){
                        console.log(self.getMyName() + ".router.generatePasswordResetCode");
                        var data = req.body;
                    self.generatePasswordResetCode(data, function(err, success){
                            console.log(self.getMyName() + ".router.generatePasswordResetCode.callback");
                            var responseData = {};

                            if(err){
                                    responseData.success = false;
                                    responseData.err = err;
                            }
                            else{
                                    responseData = success;
                            }

                            res.end(JSON.stringify(responseData));
                    });
                });

                this.router.on('resetPassword', function(req, res){
                        console.log(self.getMyName() + ".router.resetPassword");
                        var data = req.body;
                    self.validatePasswordResetCode(data, function(err, success){
                            console.log(self.getMyName() + ".router.validatePasswordResetCode.callback");
                            var responseData = {};

                            if(err){
                                    responseData.success = false;
                                    responseData.err = err;
                            }
                            else{
                                    responseData = success;
                            }

                            res.end(JSON.stringify(responseData));
                    });
                });
        },

        createNewItem:function(data, callback){
                console.log(this.getMyName() + ".createNewItem");
                console.log(data);
                var newItem = new User(data);
                newItem.passwordSalt = this.makeSalt();
                newItem.password = this.encryptPassword({password:data.password, salt:newItem.passwordSalt});
                this.saveNewItem(newItem, callback);
        },

        saveNewItem:function(newItem, callback){
                console.log(this.getMyName() + ".saveNewItem");
                newItem.save(function (err, savedItem){
                        if(err){
                                console.log("There was an error!  Item not saved!");
                                console.log(err);
                                callback(err);
                        }
                        else {
                                console.log('New Item Saved');
                                callback(undefined, savedItem);
                        }
                });
        },

        findOrCreateItem:function(data, callback){
                console.log(this.getMyName() + ".findOrCreateItem");
                console.log(data);
                var self = this;
                self.getPatronItem().findOne(data.username, function(err, item){
                        console.log(self.getMyName() + ".findOrCreateItem.callback");
                        if(err){
                                console.log(err);
                                callback(err);
                        }
                        else{
                                if(item){
                                        callback(undefined, item);
                                        console.log("Item Found!");
                                        return;
                                }

                                self.createNewItem(data, function(err, newItem){
                                		console.log("Item Created Successfully!");
                                		if(err){
                                			console.log("There was an error.")
                                			callback(err, undefined);
                                			return;
                                		}
                                		callback(undefined, newItem);
                                        return;
                                });
                           	}
                });
        },

        findItem:function(info, callback){
                var self = this;
                self.getPatronItem().findOne(info, function(err, profile){
                        if(err){
                                console.log(err);
                                callback(err);
                        }
                        else{
                                if(profile){
                                        callback(undefined, profile);
                                }
                                else{
                                        
                                        callback(undefined, undefined);
                                }
                        }
                });
        },

        getItemList:function(callback){
                var self = this;
                self.getPatronItem().find(function (err, itemList){
                        if(err){
                                console.log("There was an error!  No items!");
                                console.log(err);
                        }
                        else {
                                console.log("Found the item list!");
                                console.log(itemList);
                                callback(itemList);
                        }
                });
        },

        updateItem:function(params, callback){
                console.log("ProfileManager.updateItem");
                console.log(params);
                var self = this;
                self.getPatronItem().update({'_id':params._id},params.item,function (err, numberAffected){
                        if(err){
                                console.log("There was an error editing the item!");
                                console.log(err);
                        }
                        else {
                                console.log("Update Successful");
                                console.log(numberAffected + " documents were updated");
                                callback(undefined, true);
                        }
                });
        },



        deleteItem:function(params, callback){
                var self = this;
                self.findItem(params, function(err, item){
                        if(err){
                                console.log("There was an error!  No items!");
                                callback(err);
                        }
                        else {
                                console.log("Found the item!");
                                console.log(item);
                                if(item){
                                        self.getPatronItem().remove(item, function(err){
                                                if(err){
                                                        console.log("There was an error removing this item.");
                                                }
                                                else {
                                                        console.log("Item Removed");
                                                        callback(undefined, true);
                                                }
                                        });
                                }
                        }
                })
        },

        saveItem:function(item, callback){
                console.log(this.getMyName() + ".saveItem");
                item.save(function(err){
                        if(err){
                                console.log(err);
                                callback(err);
                        }
                        else{
                                console.log("Item Saved Successfully");
                                callback(undefined, item);
                        }
                });
        },

        makeSalt : function(){
                return Math.round((new Date().valueOf() * Math.random())) + '';
        },

        encryptPassword : function (params, callback){
                console.log(params);
                return crypto.createHmac('sha1', params.salt).update(params.password).digest('hex');
        },

        authenticatePassword : function (params, callback){
                console.log(this.getMyName() + ".authenticatePassword");
                console.log(params);
                return this.encryptPassword({password:params.plainText, salt:params.salt}) === params.password;
        },

        changeUserPassword : function (params, callback){
            var self = this;
            console.log(params);
            //return callback(undefined, params);
            self.getPatronItem().findOne({ username: params.username }, function (err, user) {
              if (err) {console.log(err); return callback(err); }
              if (!user) {
                console.log("Incorrect Username");
                return callback('Incorrect username.');
              }
              params.plainText = params.currentPassword;
              params.salt = user.passwordSalt;
              params.password = user.password;
				if(!self.authenticatePassword(params)){
					callback("Password was Incorrect");
					return;
				}
              user.password = self.encryptPassword({password:params.newPassword, salt:user.passwordSalt});
              user.save(function(){
                    if(err){
                        console.log(err);
                    }
                    else{
                        console.log("User Password Updated Successfully?");
                        return callback(undefined, user);
                    }
                });
            });
        },

        generatePasswordResetCode : function(params, callback){
                console.log(this.getMyName() + ".generatePasswordResetCode");
                var self = this;
                var code = Math.floor(Math.random()*90000) + 10000;
                var time = new Date();
                if(params.username == undefined || params.username == ""){
                        return callback(undefined, {success:false, message:"No username was specified"});
                }

                this.getPatronItem().findOne({ username: params.username }, function (err, user) {
                      if (err) {console.log(err); return done(err); }
                      if (!user) {
                        console.log("Incorrect Username");
                        return callback(undefined, {success:false, message:"No user by that username"});
                      }

                      var codeObject = {};
                      codeObject = {
                              code:code,
                              time:time,
                              user:user._id,
                              username:params.username,
                              sent:undefined
                      };
                      user.passwordResetCode = codeObject;
                      self.saveItem(user, function(err, savedItem){
                      	if(err){
                      		console.log(err);
                      		return
                      	}

                      		console.log(savedItem);
                      		var transport = nodemailer.createTransport("SMTP", {
											    service: "Gmail",
											    auth: {
											        user: "username@gmail.com",
											        pass: "email-password"
											    }
											});

							var mailOptions = {
							    from: "username@gmail.com",
							    to: savedItem.username,
							    subject: "Request to Reset Your Password",
							    text: "Hi!  Here's your password reset link! http://72.2.114.75/resetmypassword?username=" + savedItem.username + "&code=" + savedItem.passwordResetCode.code, 
							    html: "<p>Hi!  You or someone pretending to be you, forgot your password and wants to reset it!  If it was you, click the following link! http://72.2.114.75/resetmypassword?username=" + savedItem.username + "&code=" + savedItem.passwordResetCode.code + "</p> <p>If it was someone pretending to be you, don't panic!  Just because they know your email address doesn't mean they know your passwords.</p><p>If you're someone pretending to be someone else.....shame on you!  We hope your stomach does backflips with guilt!</p>" 
							};

							console.log("Mail Options");
							console.log(mailOptions);

							transport.sendMail(mailOptions, function(err, response){
								console.log("Mail send complete");
								if(err){
									console.log("There was an error");
									console.log(err);
								}
								console.log(response);
							});
                      		return callback(undefined, {success:true, code:codeObject, message:"Your code has been generated"});

                      });
                });
        },

        validatePasswordResetCode : function(params, callback){
                console.log(this.getMyName() + ".validatePasswordResetCode");
                console.log(params);
                var self = this;
                var now = new Date();
                var then;
                if(params.username == undefined || params.username == ""){
                        return callback(undefined, {success:false, message:"No username was specified"});
                }

                this.getPatronItem().findOne({ username: params.username }, function (err, user) {
					if (err) {console.log(err); return done(err); }
					if (!user) {
						console.log("Incorrect Username");
						return callback(undefined, {success:false, message:"No user by that username"});
					}

					if(params.resetCode != user.passwordResetCode.code){
						return callback(undefined, {success:false, message:"Code Is Not Valid"});
					}

					then = user.passwordResetCode.time;
					var diffMs = (now - then); // milliseconds between now & Christmas
					//var diffDays = Math.round(diffMs / 86400000); // days
					//var diffHrs = Math.round((diffMs % 86400000) / 3600000); // hours
					var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
					console.log("It has been " + diffMins + " minutes since this code was generated.");
					if(diffMins > 30){
					        return callback(undefined, {success:false, message:"Code is Expired"});
					}
					else {
							user.password = self.encryptPassword({password:params.newPassword, salt:user.passwordSalt});
							user.passwordResetCode = {};
							self.saveItem(user, function(err, savedItem){
								if(err){
									console.log(err);
									return callback(undefined, {success:false, message:"There was an error updating your password."});
								}

									console.log(savedItem);
									return callback(undefined, {success:true, message:"Code Validated"});

							});
					        
					}
                });
                
                
        }
    }

exports.UserManager = new UserManager();
exports.UserManager.init();