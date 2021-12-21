const core = require('@actions/core');

var planJSON = core.getInput('plan_json', {required: true});

async function run(){
 console.log(planJSON); 
}
