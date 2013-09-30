var fs = require('fs');

// file is included here:
eval(fs.readFileSync('scripts/helper/util.js')+'');
eval(fs.readFileSync('scripts/testing.js')+'');


console.log("here");

console.log("got " + spectralnorm(10));

var jobs = new Array();
spectTrue = spectralnorm(10);

//Going forward, the use case for this will be that we will pass it spectralnorm, and then spectralnorm_instrumented. We will obtain spectTrue in the same way, and assert that the output
//of spectralnorm_instrumented(10) = spectTrue

//right now, since we don't have a means to create the alternative javascript, I'm just perturbing the target value and making sure that the tests fail. 

jobs.push(new Array(spectralnorm, 10, spectTrue,"spect-should-pass"));
jobs.push(new Array(spectralnorm, 10, spectTrue + .001,"spect-should-fail"));


nbdTrue = runNBody(10);
jobs.push(new Array(runNBody, 10, 2*nbdTrue,"nbody-should-fail"));
jobs.push(new Array(runNBody, 10, nbdTrue,"nbody-should-pass"));



console.log("running tests");
doTests(jobs);

