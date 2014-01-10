var addError = function(element, message){
  element.parent().addClass("has-error").removeClass("has-success");
  element.siblings(".help-block").children("small").html(message);
  element.siblings(".help-block").show();
}

var addSuccess = function(element){
  element.parent().addClass("has-success").removeClass("has-error");
  element.siblings(".help-block").children("small").html("");
  element.siblings(".help-block").hide();
}

function LoginCtrl($scope) {
  $scope.dataServer = "/";
  $scope.data = {};
  $scope.data.username = "";
  $scope.data.password = "";

  $scope.validateForm = function(){
    console.log("Validating Form");
    var formIsValid = true;
    if($scope.data.username == ""){
      addError($("input[name='username']"), "This field can not be empty.");
      formIsValid = false;
    }
    else if (!/(.+)@(.+){2,}\.(.+){2,}/.test($scope.data.username)){
      //Match email to standard email format.  x@xx.xx
      addError($("input[name='username']"), "Email address is not valid.");
      formIsValid = false;
    }
    else {
      addSuccess($("input[name='username']"));
    }

    if($scope.data.password == ""){
      //Make sure password is not empty
      addError($("input[name='password']"), "This field can not be empty.");
      formIsValid = false;
    }
    else if (!/[a-zA-Z0-9\(\)\*\@\!]{6,}/.test($scope.data.password)){
      //Make sure password is at least 6 characters long and contains no illegal characters
      //Legal characters include ()*@!
      addError($("input[name='password']"), "Password must be at least 6 letters, numbers or the following characters: ()*@!");
      formIsValid = false;
    }
    else {
      addSuccess($("input[name='password']"));
    }

    return formIsValid;
  },
 
  $scope.submit = function() {
    console.log("Starting submission process.");
    if($scope.validateForm()){
      console.log("Form Data is Valid");
      $("#loginForm").submit();
    }
    else {
      console.log("Form Data is Invalid");
    }
  };
}


function ChangePasswordCntrl($scope) {
  $scope.dataServer = "/userAdmin/";
  $scope.data = {};
  $scope.data.username = "";
  $scope.data.currentPassword = "";
  $scope.data.newPassword = "";
  $scope.data.verifyNewPassword = "";


  $scope.validateForm = function(){
    console.log("Validating Form");
    var formIsValid = true;
    if($scope.data.currentPassword == ""){
      //Make sure password is not empty
      addError($("input[name='currentPassword']"), "This field can not be empty.");
      formIsValid = false;
    }
    else {
      addSuccess($("input[name='currentPassword']"));
    }

    if($scope.data.newPassword == ""){
      //Make sure password is not empty
      addError($("input[name='newPassword']"), "This field can not be empty.");
      formIsValid = false;
    }
    else {
      addSuccess($("input[name='newPassword']"));
    }

    if($scope.data.verifyNewPassword == ""){
      //Make sure verifyNewPassword is not empty
      addError($("input[name='verifyNewPassword']"), "This field can not be empty.");
      formIsValid = false;
    }
    else if ($scope.data.newPassword != $scope.data.verifyNewPassword){
      addError($("input[name='verifyNewPassword']"), "Passwords do not match.");
      formIsValid = false;
    }
    else {
      addSuccess($("input[name='verifyNewPassword']"));
    }

    return formIsValid;
  },

  $scope.submit = function() {
    console.log("Starting submission process.");
    $scope.data.username = $("#username").val();
    console.log($scope.data.username);
    console.log($scope.data.currentPassword);
    console.log($scope.data.newPassword);
    console.log($scope.data.verifyNewPassword);
    if($scope.validateForm()){
      console.log("Form Data is Valid");
      $.ajax({
          url:$scope.dataServer + "changeUserPassword",
          type:"POST",
          contentType: "application/json; charset=utf-8",
          data:JSON.stringify($scope.data),
          complete:function(data){
            console.log("Ajax Call Complete");
            console.log(data);
            console.log(data.responseText);
            var response = JSON.parse(data.responseText);
            console.log(response);
            console.log(response.success);
            if(response.success && response.success == true){
              $("#alertContainer").html("<div class='alert alert-success'>Password Changed Successfully</div>");
              $scope.data.currentPassword = "";
              $scope.data.newPassword = "";
              $scope.data.verifyNewPassword = "";
              $scope.$apply();
            }
            else {
              $("#alertContainer").html("<div class='alert alert-danger'>" + response.err + "</div>");
            }
          }
      });
    }
    else {
      console.log("Form Data is Invalid");
    }
  };
}

function forgotPasswordCntrl($scope) {
  $scope.dataServer = "/userAdmin/";
  $scope.data = {};
  $scope.data.username = "";


  $scope.validateForm = function(){
    console.log("Validating Form");
    var formIsValid = true;
    if($scope.data.username == ""){
      //Make sure password is not empty
      addError($("input[name='username']"), "This field can not be empty.");
      formIsValid = false;
    }
    else {
      addSuccess($("input[name='username']"));
    }

    return formIsValid;
  },

  $scope.submit = function() {
    console.log("Starting submission process.");
    console.log($scope.data.username);
    if($scope.validateForm()){
      console.log("Form Data is Valid");
      $.ajax({
          url:$scope.dataServer + "generatePasswordResetCode",
          type:"POST",
          contentType: "application/json; charset=utf-8",
          data:JSON.stringify($scope.data),
          complete:function(data){
            console.log("Ajax Call Complete");
            console.log(data);
            console.log(data.responseText);
            var response = JSON.parse(data.responseText);
            console.log(response);
            console.log(response.success);
            if(response.success && response.success == true){
              $("#alertContainer").html("");
              $("#formContainer").html("An email has been sent to your email address with instructions on how to change your password.");
            }
            else {
              $("#alertContainer").html("<div class='alert alert-danger'>" + response.message + "</div>");
            }
          }
      });
    }
    else {
      console.log("Form Data is Invalid");
    }
  };
}

function resetPasswordCntrl($scope) {
  $scope.dataServer = "/userAdmin/";
  $scope.data = {};
  $scope.data.username = "";
  $scope.data.resetCode = "";
  $scope.data.newPassword = "";
  $scope.data.verifyNewPassword = "";


  $scope.validateForm = function(){
    console.log("Validating Form");
    var formIsValid = true;
    if($scope.data.newPassword == ""){
      //Make sure password is not empty
      addError($("input[name='newPassword']"), "This field can not be empty.");
      formIsValid = false;
    }
    else {
      addSuccess($("input[name='newPassword']"));
    }

    if($scope.data.verifyNewPassword == ""){
      //Make sure verifyNewPassword is not empty
      addError($("input[name='verifyNewPassword']"), "This field can not be empty.");
      formIsValid = false;
    }
    else if ($scope.data.newPassword != $scope.data.verifyNewPassword){
      addError($("input[name='verifyNewPassword']"), "Passwords do not match.");
      formIsValid = false;
    }
    else {
      addSuccess($("input[name='verifyNewPassword']"));
    }

    return formIsValid;
  },

  $scope.submit = function() {
    console.log("Starting submission process.");
    if($scope.validateForm()){
      console.log("Form Data is Valid");
      $scope.data.username = $("input[name='username'").val();
      $scope.data.resetCode = $("input[name='resetCode']").val();
      $.ajax({
          url:$scope.dataServer + "resetPassword",
          type:"POST",
          contentType: "application/json; charset=utf-8",
          data:JSON.stringify($scope.data),
          complete:function(data){
            console.log("Ajax Call Complete");
            console.log(data);
            console.log(data.responseText);
            var response = JSON.parse(data.responseText);
            console.log(response);
            console.log(response.success);
            if(response.success && response.success == true){
              $("#alertContainer").html("");
              $("#formContainer").html("Your password has been successfully reset.  Click here to login.");
            }
            else {
              $("#alertContainer").html("<div class='alert alert-danger'>" + response.message + "</div>");
            }
          }
      });
    }
    else {
      console.log("Form Data is Invalid");
    }
  };
}