// ==UserScript==
// @name         Fitbit Utilities
// @namespace    http://ligature.me
// @version      0.1
// @description  Various utilities for the Fitbit web app, including converting activities to CSV.
// @homepageURL   https://github.com/scytalezero/FitbitUtilities
// @updateURL     https://github.com/scytalezero/FitbitUtilities/raw/master/FitbitUtilities.user.js
// @downloadURL   https://github.com/scytalezero/FitbitUtilities/raw/master/FitbitUtilities.user.js
// @author       ScytaleZero
// @match        https://www.fitbit.com/activities
// @grant        none
// ==/UserScript==

var rows = [];

function Workout() {
  this.date = null;
  this.activity = "";
  this.steps = 0;
  this.distance = 0;
  this.duration = 0;
  this.calories = 0;
  this.heartAverage = 0;
  this.heartPeakMin = 0;
  this.heartCardioMin = 0;
  this.heartFatMin = 0;
  this.caloriesPerMin = 0;
  this.id = null;
  
}
//Return CSV headers for these rows.
Workout.prototype.toHeader = function() {
  var output = "\"Workout ID\"";
  output += ",\"Date\"";
  output += ",\"Activity Name\"";
  output += ",\"Steps\"";
  output += ",\"Distance (mi)\"";
  output += ",\"Duration (s)\"";
  output += ",\"Calories\"";
  output += ",\"Averate Heart Rate\"";
  output += ",\"Peak HRZ (m)\"";
  output += ",\"Cardio HRZ (m)\"";
  output += ",\"Fat Burn HRZ (m)\"";
  output += ",\"Calories/m\"";

  return output;
};
//Return this workout as a line of CSV.
Workout.prototype.toCSV = function() {
  var output = this.id;
  output += ",\"" + this.date.toLocaleString() + "\"";
  output += ",\"" + this.activity + "\"";
  output += "," + this.steps;
  output += "," + this.distance;
  output += "," + this.duration;
  output += "," + this.calories;
  output += "," + this.heartAverage;
  output += "," + this.heartPeakMin;
  output += "," + this.heartCardioMin;
  output += "," + this.heartFatMin;
  output += "," + this.caloriesPerMin;

  return output;
};
//Use the ID to fetch heart rate info for this workout. Returns a promise.
Workout.prototype.Fetch = function() {
  var me = this; //Closure our object reference
  return $.get("/activities/exercise/" + this.id).done(function(data) {
    me.heartAverage = Number($(data).find(".heart-rate .value").text());
    me.heartPeakMin = Number($(data).find(".peak-minutes .value").text());
    me.heartCardioMin = Number($(data).find(".cardio-minutes .value").text());
    me.heartFatMin = Number($(data).find(".fat-burn-minutes .value").text());
    me.caloriesPerMin = Number($(data).find(".calories .stats .value").text());
  });
}

//Pulls data from the activity list.
function Parse() {
  var rowPromises = [];
  
  $(".logs > tbody").each(function(index) {
    var row = new Workout();
    row.id = $(this).data("log-id");
    row.date = new Date($(this).find("time").attr("datetime").replace("Z", "-05:00"));
    $(this).find(".activity .name form").remove();
    row.activity = $($(this).find("td")[1]).text().trim();
    row.steps = Number($($(this).find("td")[2]).text().replace(",", ""));
    row.distance = Number($($(this).find("td")[3]).text().replace(" miles", ""));
    var durationBase = $($(this).find("td")[4]).text().match(/(\d+):(\d+)/);
    row.duration = Number(durationBase[1]) * 60 + Number(durationBase[2]);
    row.calories = Number($($(this).find("td")[5]).text().replace(" cals", ""));
    rows.push(row);
    rowPromises.push(row.Fetch());
  });
  $.when.apply($, rowPromises).then(function() {
    Out(rows[0].toHeader());
    for (var i=0; i < rows.length; i++) {
      Out(rows[i].toCSV());  
    }
  });
}

//Modify the UI of the page as necessary.
function Prepare() {
  //Add the action button
  $(".activity-history > h2").append(" <input id='CreateCSV' type='button' value='Create CSV'/>");
  $("#CreateCSV").click(Parse);
  //Add the output area
  $(".activity-history").append("<textarea id='Output' cols='100' rows='20' />");
}

function Out(buffer) {
  $("#Output").append(buffer + "\n");
}

Prepare();
