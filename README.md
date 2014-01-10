low-sec-login-lego
==================

A super simple web server equipped with basic user login, and minimal security.  To register, the user simply puts in an email address as a username, and a password and that password will be associated with that email address from then on.  The user can change their password via the settings page, or with the "Forgot Password" functionality, which will email them a link to reset their password.

##Features:
* Preconfigured NodeJS based web server using Express
* Front end templates(using Jade) and server side code for the following actions:
  * User Login/Registration
  * Forgot Password
  * Reset Password
  * Change Password (via settings.jade)
* Reset password emails via NodeMailer


##Serverside technologies:
* NodeJS
* MongoDB
* Mongoose
* Express
* NodeMailer
* Jade

##Clientside technologies:
* Bootstrap
* Jquery
* Angularjs


##Usage:
* Put the files on your server
* Run "npm install" from the command line -as a superuser or admin- to install all the depencies
* Change the name of the database in /lib/loginManager/managers.js
* Add your database username and password if applicable.  If not, remove the fields from the "opts" variable
* Change the username and password of the email account used in the function named generatePasswordResetCode, in /lib/loginManager/managers.js
* Run npm start
