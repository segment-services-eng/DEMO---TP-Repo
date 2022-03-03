const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
// const fetch = require('node-fetch');
var request = require('request');



try {
console.log("Current directory:", __dirname);
let payloadFile = fs.readFileSync('/home/runner/work/_actions/rishnair/protocols-diffs/main/src/analytics-autogenerated/plan.json');
let payloadJSON = JSON.parse(payloadFile);
delete payloadJSON["name"];
delete payloadJSON["create_time"];
delete payloadJSON["update_time"];

let newJSON = {};
newJSON["update_mask"] = {
    "paths": [
      "tracking_plan.rules",
    ]
  };
newJSON["tracking_plan"] = payloadJSON;
var json = JSON.stringify(newJSON);

var options = {
    'method': 'PUT',
    'url': 'https://platform.segmentapis.com/v1beta/workspaces/protocols-diffs/tracking-plans/rs_25qwKyvscf4mcxbPA6c1xO4xJRf',
    'headers': {
      'Authorization': 'Bearer lz76O8KXwjMeYnnvk3aKlCas721IFP-7x2V7s_oN8kc.DwF1Wi8UGqZ12AbVJFXY_Aa7ebBBUiCdXwXUiyy8xvk',
      'Content-Type': 'application/json'
    },
    body: json
    };

request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
    });

} catch (error) {
  core.setFailed(error.message);
}