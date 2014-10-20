var myDataRef = new Firebase('https://findmydeardog.firebaseio.com/');

$(function () {
	$( "#settings-toggle" ).click(function() {
	  $( "#settings-hide" ).animate({
	    height: "toggle"
	  }, 500, function() {
	    // Animation complete.
	  });
	});
	
	//console.log("on? " + getCookie("turned_on"));
  if (convertBoolean(getCookie("turned_on"))) {
    $('#on-off').prop("checked", true);
  }

	if (convertBoolean(getCookie("follow_device"))) {
		$('#followDeviceBtn').hide();
		$('#unfollowDeviceBtn').show();
	}

	$('.on-off :checkbox').iphoneStyle();
	Parse.initialize('5PiDj5mmWu0MlMbqRrSBhqafp4nome88BqM0uvJs', 'ScrtuaWOtSQ2sCpnEPEh8BjpCJhUxSHAm6MLEoMc');
	
	//if there is a username and password, then there must be a phonenumber, radius, and baselocation
	var username = getCookie("username");
	var password = getCookie("password");

	if (getUserFromFirebase(username, password, 'mainscreen'))
	{
		$("#user_id").text(getCookie("username"));
		initialize();
		var phoneNumber = getCookie("phoneNumber");
		var radius = getCookie("radius");
		var baseLocation = getCookie("baseLocation");
		
		if (phoneNumber && radius && baseLocation)
		{
			changeStatus("Login");
		}	
	} 
	
	var input = document.getElementById('pac-input');
	var searchBox = new google.maps.places.SearchBox((input));
	
	google.maps.event.addListener(searchBox, 'place_changed', function() {
		var place = searchBox.getPlace();
		if (!place.geometry) {
			return;
		}
	});
});

function setOnOff() {
	if (getUserFromFirebase(username, password, 'mainscreen'))
	{
		if (convertBoolean(getCookie("turned_on"))) {
	    	$('#on-off').prop("checked", true);
		}
	} 
}

function getCookie(cname)
{
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i=0; i<ca.length; i++) 
	{
		var c = ca[i].trim();
		if (c.indexOf(name) == 0) 
			return c.substring(name.length,c.length);
	}
	return null;
}

function setCookie(cname,cvalue,exdays)
{
	var d = new Date();
	d.setTime(d.getTime()+(exdays*24*60*60*1000));
	var expires = "expires="+d.toGMTString();
	document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
}

function changeStatus(status)
{
	if (status == "Logout")
	{
		clearAllCookies(); 
		$("#user_id").text("");
	}
}

function clearAllCookies()
{
	for (var i = 0; i < 3; i++)
	{
		setCookie('username', "", -1);
		setCookie('password', "", -1);
		setCookie('radius', "", -1);
		setCookie('phoneNumber', "", -1);
		setCookie('baseLocation', "", -1);
		setCookie('baseLat', "", -1);
		setCookie('baseLong', "", -1);
		setCookie('dog_added', "", -1);
		setCookie('initialized', "", -1);
		setCookie('turned_on', "", -1);
	}
}

function setAllCookies(username, password, radius, phoneNumber, baseLocation, baseLat, baseLong, turned_on)
{
	setCookie('username', username, 30);
	setCookie('password', password, 30);
	setCookie('radius', radius, 30);
	setCookie('phoneNumber', phoneNumber, 30);
	setCookie('baseLocation', baseLocation, 30);
	setCookie('baseLat', baseLat, 30);
	setCookie('baseLong', baseLong, 30);
	setCookie('turned_on', turned_on, 30);
}

function checkLogInOrOut()
{
	var username = getCookie("username");
	
	if (!username)
	{
		//means it's showing "Login"
		showModal('#loginModal');	
	}
	else
	{
		//means it's showing "Logout"
		logout();
	}
}

function checkLogInOrOut2()
{
	var username = getCookie("username");
	
	if (!username)
	{
		//means it's showing "Login"
		showModal('#loginModal');	
	}
	else
	{
		//means it's showing "Logout"
		loadUser();
	}
}

function loadUser(page)
{
	var username = getCookie("username");
	
	if (!username)
	{
		if (page == 'main')
			showModal('#loginModal');
		else
			window.location.href = 'index.html';
	}
	else
	{
		$("#user_id").text(username);
		changeStatus("Login");
		initialize();
	}
}

function checkFirebaseForLogin(username, password, module)
{
	//check Firebase for login name	
	if(getUserFromFirebase(username, password, module))
	{
		//if good then change the Login to Logout and set variables, close loginModal
		if (module == 'login')
		{
			hideModal('#loginModal');
		}
		return true;
	}
	else
	{
		return false;
	}
}

function createFirebaseUser(username, password, phoneNumber, radius, baseLocation, turned_on)
{
	var geoLocate = "https://maps.googleapis.com/maps/api/geocode/json?address=" + baseLocation + "&sensor=false&key=AIzaSyAjECgtOkJf0xeIpProlCseMUfh4VF6jGg";
	var result;
	$.ajax ({
		dataType: "json",
		url: geoLocate,
		async: false,
		success: function(data) {
			result = data
		}
	});

	var baseLat = result['results'][0]['geometry']['location']['lat'];
	var baseLong = result['results'][0]['geometry']['location']['lng'];

	 if (checkFirebaseForLogin(username, password, 'register'))
	 {
	 	myDataRef.child('user').child(username).set({
			'Password': password, 
			'Base_Location': baseLocation,
			'baseLat': baseLat,
			'baseLong': baseLong,
			'Phone_Number': phoneNumber,
			'Threshold': radius,
			'dogLat': null,
			'dogLng': null,
			'Turned_On': false
			});
			
		setAllCookies(username, password, radius, phoneNumber, baseLocation, baseLat, baseLong, turned_on);
		return true;
	 }
	 
	 return false;
}

function updateSingleFirebaseAttribute(username, attrname, attr)
{
	var newAttr = {};
	newAttr[attrname] = attr;
	myDataRef.child('user').child(username).update(newAttr);
}

function fillInFrontpage(phoneNumber, radius, baseLocation)
{
	$("#new_radius").val(radius);
	$("#new_phonenumber").val(phoneNumber);
	$("#pac-input").val(baseLocation);
}

function getUserFromFirebase(username, password, module)
{
	if (username && password && module)
	{
		//check firebase for the user
		var firebaseAPI = "https://findmydeardog.firebaseio.com/user/" + username+ ".json";
		var result;
		$.ajax ({
			dataType: "json",
			url: firebaseAPI,
			async: false,
			success: function(data) {
				result = data
			}
		});
		
		if (result != 'null' && result != null)
		{
			if (module == 'login')
			{
				if (result['Password'] == password)
				{
					setUser(username, password, result['Phone_Number'], result['Threshold'], result['Base_Location'], result['baseLat'], result['baseLong'], result['Turned_On']);
					return true;
				}
				else
				{
					setError('no_pass', module);
					return false;
				}
			}
			else if (module == 'register')
			{
				
				setUser(username, password, result['Phone_Number'], result['Threshold'], result['Base_Location'], result['baseLat'], result['baseLong'], result['Turned_On']);
				return false;
			}
			else if (module == 'mainscreen')
			{
				setUser(username, password, result['Phone_Number'], result['Threshold'], result['Base_Location'], result['baseLat'], result['baseLong'], result['Turned_On']);
				return true;	
			}
			
		}
		else
		{
			if (module == 'login')
			{
				setError('no_user', module);
				return false;
			}
			else if (module == 'register') 
			{
				return true;
			}
			else if (module == 'mainscreen')
			{
				return false;
			}
		}
	} 
	else 
	{
		setError('no_user', module);
		return false;	
	}
}

function setUser(username, password, phoneNumber, radius, baseLocation, baseLat, baseLong, turned_on)
{
	fillInFrontpage(phoneNumber, radius, baseLocation);
	setAllCookies(username, password, radius, phoneNumber, baseLocation, baseLat, baseLong, turned_on);
}

function login()
{
	var username = $("#username").val();
	var password = $("#password").val();
	
	if (checkFirebaseForLogin(username, password, 'login'))
	{
		changeStatus("Login"); //doesn't really do anything though...
		$("#user_id").text(getCookie("username"));
		$("#login_error").css('display', 'none');
	}
}

function logout()
{
	var res = confirm("Are you sure you want to logout?");
	if (res) changeStatus("Logout");	
}

function loginTracker() {
	var username = $("#username").val();
	var password = $("#password").val();
	
	if (checkFirebaseForLogin(username, password, 'login'))
	{
		changeStatus("Login");
		initializeTracker();	
	}
}

function register()
{
	var username = $("#reg_username").val().trim();
	$("#user_id").text(username);
	var password = $("#reg_password").val().trim();
	var phoneNumber = $("#reg_phone").val();
	var radius = $("#reg_radius").val().trim();
	var baseLocation = $("#pac-input").val();

	var isANumber = (isNaN(radius) === false);
	if(!isANumber || radius == "") {
		setError('no_radius', 'register');
		return;
	}
	
	if (!isPhoneNumber(phoneNumber) || phoneNumber == "")
	{
		setError('no_num', 'register');
		return;
	}
	
	if (username == "")
	{
		setError('no_username', 'register');
		return;
	}
	
	if (password == "")
	{
		setError('no_password', 'register');
		return;
	}
	
	if (baseLocation == "")
	{
		setError('no_location', 'register');
		return;
	}
	
	if(createFirebaseUser(username, password, phoneNumber, radius, baseLocation))
	{
		hideModal("#registerModal");
		updatePhoneNumber(phoneNumber); 
	}
	else
	{
		setError('no_user', 'register');
		return;
	}
	
	$("#register_error").css('display', 'none');
}

function showModal(modal)
{
	$(modal).modal('show');
}

function hideModal(modal)
{
	$(modal).modal('hide');	
}

function setError(error, module)
{
	switch (module) {
		case 'login':
			$("#login_error").css('display', 'block');
			if (error == 'no_user')
				$("#login_error").html("Username not found");
			else if (error == 'no_pass')
				$("#login_error").html("Password not correct");		
		case 'register':
			$("#register_error").css('display', 'block');
			if (error == 'no_user')
				$("#register_error").html("Username already taken");
			if (error == 'no_radius')
				$("#register_error").html("Invalid radius");
			if (error == 'no_num')
				$("#register_error").html("Invalid phone number");
			if (error == 'no_username')
				$("#register_error").html("Please enter a username");
			if (error == 'no_password')
				$("#register_error").html("Please enter a password");
			if (error == 'no_location')
				$("#register_error").html("Please enter a location");
		case 'mainscreen':
		case 'pn_modal':
			$("#phonenumber_error").css('display', 'block');
			$("#phonenumber_error").html("Invalid Phone Number");
		case 'rad_modal':
			$("#radius_error").css('display', 'block');
			$("#radius_error").html("Invalid Radius");
			$("#personal_radius_error").css('display', 'block');
			$("#personal_radius_error").html("Invalid Radius");
		case 'base_modal':
			$("#baselocation_error").css('display', 'block');
			$("#baselocation_error").html("Invalid Base Location");
	}
}

function updateRadius()
{
	var radius = $("#new_radius").val();
	var isANumber = isNaN(radius) === false;
	if (!isANumber) {
		setError(null, 'rad_modal');
		return;
	}
	$("#radius_error").css('display', 'none');
	var username = getCookie("username");
	updateSingleFirebaseAttribute(username, "Threshold", parseInt(radius));
	setCookie("radius", radius, 30);
	hideModal("#radiusModal");
	initialize();
}

function updateBaseLocation()
{
	var baseLocation = $("#pac-input").val();

	var geoLocate = "https://maps.googleapis.com/maps/api/geocode/json?address=" + baseLocation + "&sensor=false&key=AIzaSyAjECgtOkJf0xeIpProlCseMUfh4VF6jGg";
	var result;
	$.ajax ({
		dataType: "json",
		url: geoLocate,
		async: false,
		success: function(data) {
			result = data
		}
	});

	var baseLat = result['results'][0]['geometry']['location']['lat'];
	var baseLong = result['results'][0]['geometry']['location']['lng'];

    if (!baseLat || !baseLong)
	{
		setError(null, 'base_modal');
		return;	
	}
	$("#baselocation_error").css('display', 'none');
	var username = getCookie("username");
	var password = getCookie("password");
	updateSingleFirebaseAttribute(username, "Base_Location", baseLocation);
	updateSingleFirebaseAttribute(username, "baseLat", baseLat);
	updateSingleFirebaseAttribute(username, "baseLong", baseLong);
	setCookie("baseLocation", baseLocation, 30);
	setCookie('baseLat', baseLat, 30);
	setCookie('baseLong', baseLong, 30);
	hideModal("#baseLocationModal");	
	initialize();
}

function updatePhoneNumber(num)
{
	var phoneNumber = (num !== null ? num : $("#new_phonenumber").val());
	
	//use Twilio verification here...
	//send request with phoneNumber
	Parse.Cloud.run('verifyPhoneNumber', {phoneNumber: phoneNumber}, {
	  success: function(result) {;
		  if (result.validationCode)
		  {
			  $("#validation_number").html(result.validationCode);
			  showModal("#validation");
		  }
	  }
	});
	
	if (!isPhoneNumber(phoneNumber))
	{
		setError(null, 'pn_modal');
		return;
	}
	$("#phonenumber_error").css('display', 'none');
	updateSingleFirebaseAttribute(getCookie("username"), "Phone_Number", phoneNumber);
	setCookie("phoneNumber", phoneNumber, 30);
	if (num === null) hideModal("#phoneNumberModal");	
}

function convertBoolean(str)
{
	return (str == 'true' ? true : false);
}

function isPhoneNumber(number)
{
	return (number.match(/^[(]{0,1}[0-9]{3}[)]{0,1}[-\s\.]{0,1}[0-9]{3}[-\s\.]{0,1}[0-9]{4}$/) !== null);	
}

