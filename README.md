low-sec-login-lego
==================

A super simple web server equipped with basic user login, and minimal security.

Features:
* Preconfigured NodeJS based web server using Express
* Front end templates(using Jade) and server side code for the following actions:
  * Login
  * Forgot Password
  * Reset Password
  * Change Password (via settings.jade)
* Reset password emails via NodeMailer


Serverside technologies:
* NodeJS
* MongoDB
* Mongoose
* Express
* NodeMailer
* Jade

Clientside technologies:
* Bootstrap
* Jquery
* Angularjs


Usage:
* Put the files on your server.
* Change the name of the database in /lib/loginManager/managers.js
* Add your database username and password if applicable.  If not, remove the fields from the "opts" variable
* Change the username and password of the email account used in the function named generatePasswordResetCode, in /lib/loginManager/managers.js
