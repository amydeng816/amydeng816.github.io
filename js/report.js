// JavaScript Document
var map;

var start_marker = new google.maps.LatLng(42.056918, -87.676703);
var end_marker;

Parse.initialize('5PiDj5mmWu0MlMbqRrSBhqafp4nome88BqM0uvJs', 'ScrtuaWOtSQ2sCpnEPEh8BjpCJhUxSHAm6MLEoMc');

$(function() {
	$("#from").datepicker();
	$("#to").datepicker();
	
	
});


function getTodayReport()
{
	if(getCookie("username")) {
		var date = new Date();
		
		var yymmdd = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
		
		//display as today
		$("#title").html("Report: " + (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear());
		
		//get midnight of last night
		var normalizedToday = new Date(yymmdd);
		var min = normalizedToday.getTime();
		
		//get midnight of tonight
		normalizedToday.setDate(normalizedToday.getDate() + 1);
		var max = normalizedToday.getTime();
		
		$("#yesterdaybtn").removeClass("disabled");
		$("#todaybtn").addClass("disabled");
		
		getReportInfo(min, max);
	}
	else {
		window.location = "index.html";
	}
}

function getYesterdayReport()
{
	if(getCookie("username")) {
		var date = new Date();
		
		var yymmdd = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
		
		//get midnight of last night
		var normalizedToday = new Date(yymmdd);
		var max = normalizedToday.getTime();
		
		//get midnight of tonight
		normalizedToday.setDate(normalizedToday.getDate() - 1);
		var min = normalizedToday.getTime();
		
		//display as normalized yesterday
		$("#title").html("Report: " + (normalizedToday.getMonth() + 1) + "/" + normalizedToday.getDate() + "/" + normalizedToday.getFullYear());
		$("#todaybtn").removeClass("disabled");
		$("#yesterdaybtn").addClass("disabled");
		
		getReportInfo(min, max);
	}
	else {
		window.location = "index.html";
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

function getReportInfo(minTime, maxTime)
{
	var mapOptions = {
		zoom: 17,
		center: start_marker,
		panControl: false,
		zoomControl: true,
		scaleControl: false,
		scrollwheel: false,
		navigationControl: false,
		mapTypeControl: false,
		scaleControl: false,
		draggable: false,
		keyboardShortcuts: false,
		disableDoubleClickZoom: true,
		streetViewControl: false
	}

	map = new google.maps.Map(document.getElementById('activity-map'),
		mapOptions);

	var query = new Parse.Query("Dog_Location");
	if (getCookie('username')!=null) {
		query.select("Location").equalTo("Username", getCookie('username')).lessThanOrEqualTo("Time", maxTime).greaterThanOrEqualTo("Time", minTime).descending("Time").limit(1000).find({
		  success: function(results) {
			var lat_long = new Array();
			var maxLatitude = -3000;
			var maxLongitude = -3000;
			var minLatitude = 3000;
			var minLongitude = 3000;
			if (results.length <= 1)
			{
				$("#distance").html(0.0);
				$("#speed").html(0.0);
			}
			else
			{
				for (var i = 0; i < results.length; i++)
				{
					var latitude = results[i].attributes.Location._latitude;
					var longitude = results[i].attributes.Location._longitude;
					
					if (latitude > maxLatitude)
						maxLatitude = latitude;
					if (latitude < minLatitude)
						minLatitude = latitude;
					if (longitude > maxLongitude)
						maxLongitude = longitude;
					if (longitude < minLongitude)
						minLongitude = longitude;
						
					lat_long.push({'latitude': latitude, 'longitude': longitude});
					if(i==results.length-1){
						drawRoute(lat_long);
					}
				}
				var totalDistance = 0;
				for (var i = 0; i < lat_long.length - 1; i++)
				{
					var a = new google.maps.LatLng(lat_long[i].latitude, lat_long[i].longitude);
					var b = new google.maps.LatLng(lat_long[i + 1].latitude, lat_long[i + 1].longitude);
					totalDistance += getDistance(a, b);
				}
				
				var miles = (totalDistance / 5280).toFixed(2);
				$("#distance").html(miles);
				
				var milesperhour = (miles / 24).toFixed(2);
				$("#speed").html(milesperhour);
				
				var latlng = [
					new google.maps.LatLng(maxLatitude, maxLongitude),
					new google.maps.LatLng(maxLatitude, minLongitude),
					new google.maps.LatLng(minLatitude, maxLongitude),
					new google.maps.LatLng(minLatitude, minLongitude)
				]; 
				var latlngbounds = new google.maps.LatLngBounds();
				for (var i = 0; i < latlng.length; i++)
				{
					latlngbounds.extend(latlng[i]);
				}
				map.fitBounds(latlngbounds);
			}
		  },
		  error: function(error) {
			console.log("Cannot get info from Parse");
		  }
		});	
	}
	else
	{
		$("#distance").html(0.0);
		$("#speed").html(0.0);
	}
}

function getDistance(loc, pos) {
  //calculate distance in meters
  var d = google.maps.geometry.spherical.computeDistanceBetween(loc, pos);
  return 3.28084*d; //convert to feet
}

function createActivityMap() {
	//to create the map, I am getting the today's report
	getTodayReport();
	
	var width = $($(".stat-circle")[0]).width();
	$($(".quick-stat")[0]).width(width);
	$($(".quick-stat")[1]).width(width);
	var width2 = $($(".quick-stat")[0]).width();
	$("#centered").width(width * 2);
	return;
}

function drawRoute(result) {
	for(var i=1; i<result.length; i++) {
		var point1 = new google.maps.LatLng(result[i-1]['latitude'], result[i-1]['longitude']);
		var point2 = new google.maps.LatLng(result[i]['latitude'], result[i]['longitude']);
		var line_seg = new google.maps.Polyline({
			path: [point1, point2],
			geodesic: true,
			strokeColor: '#008f8F',
			strokeWeight: 3,
			strokeOpacity: 0.8
		});
		line_seg.setMap(map);
		if(i==1) {
			var start = new google.maps.Marker({
				position: point1,
				map: map,
				title: "Ending Location",
				icon: 'images/letter_e.png',
				animation: google.maps.Animation.DROP
			});
		}
		if(i==result.length-1) {
			var end = new google.maps.Marker({
				position: point2,
				map: map,
				title: "Starting Location",
				icon: 'images/letter_s.png',
				animation: google.maps.Animation.DROP
			});
			map.setCenter(point2);
		}
	}
}

function changeTimeSpan()
{
	if(getCookie("username")) {
		//some parsing to get the millisecond value
		var from = $("#from").val();
		var to = $("#to").val();
		from = from.replace(/ /g, "");
		to = to.replace(/ /g, "");
		
		if (!from || !to || from == "" || to == "")
		{
			$("#timespan_error").css('display', 'block');
			$("#timespan_error").html("Need to include two dates!");
			return;
		}
		
		var fromDate = new Date(from);
		var toDate = new Date(to);
		toDate.setDate(toDate.getDate() + 1);  //make it the midnight of the day we're wanting
		
		var fromTime = fromDate.getTime();
		var toTime = toDate.getTime();
		
		if (toTime < fromTime)
		{
			$("#timespan_error").css('display', 'block');
			$("#timespan_error").html("Cannot check in reverse. Switch 'From' and 'To'!");
			return;
		}
		
		//reenabled if needed
		$("#yesterdaybtn").removeClass("disabled");
		$("#todaybtn").removeClass("disabled");
		
		console.log(fromTime, toTime);
		
		getReportInfo(fromTime, toTime);
		$("#title").html("Report: " + from + " - " + to);
		
		$('#timeSpanModal').modal('hide');
	}
	else {
		window.location = "index.html";
	}
}

function sleep(millis, callback) {
	setTimeout(function()
		{ callback(); }
	, millis);
}

function createScreenShot(){
	var address = $("#email_address").val().trim();
	var body = $("#email_body").val().trim();
	if (body == "") body = "(no body)";
	if (address == "") return;
	var subject = document.title;
	var stats = document.getElementById("stats");
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		html2canvas(stats, {
		  onrendered: function(canvas) {
			
			var content = canvas.toDataURL();
			var base64part = content.split(",")[1];
			Parse.Cloud.run('sendEmailReport', {email_address: address,
												 title: subject,
												 body: body,
												 content: base64part}, {
			  success: function(result) {
				console.log(result);
			  },
			  error: function(result, err) {
				console.log(err);
				console.log(result);
			  }
			});
			
		  }
		});
	}
	else
	{
		html2canvas(stats, {
		  proxy: "html2canvas-proxy-node/server.js",
		  useCORS: true,
		  logging: true,
		  onrendered: function(canvas) {
			
			var content = canvas.toDataURL();
			var base64part = content.split(",")[1];
			Parse.Cloud.run('sendEmailReport', {email_address: address,
												 title: subject,
												 body: body,
												 content: base64part}, {
			  success: function(result) {
				console.log(result);
			  },
			  error: function(result, err) {
				console.log(err);
				console.log(result);
			  }
			});
			
		  }
		});
	}
};

function sendEmailReport()
{
	$('#emailModal').modal('hide');
	
	//need to sleep 5 seconds to wait for the modal to fade out so screenshot is natural
	sleep(5000, createScreenShot);
}

google.maps.event.addDomListener(window, 'load', createActivityMap);
