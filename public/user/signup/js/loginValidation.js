$(document).ready(function() {
    $("#loginForm").validate({
      rules: {
        username: {
          required: true,
          minlength: 3
        },
        password: {
          required: true,
          minlength: 5
        }
      },
      messages: {
        username: {
          required: "Please enter a username",
          minlength: "Your username must consist of at least 3 characters"
        },
        password: {
          required: "Please provide a password",
          minlength: "Your password must be at least 5 characters long"
        }
      }
    });
  });
  