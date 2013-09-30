var fs = require('fs');

// file is included here:
eval(fs.readFileSync('scripts/helper/util.js')+'');
eval(fs.readFileSync('scripts/testing.js')+'');


console.log("here");

console.log("got " + spectralnorm(10));

var jobs = new Array(new Array(spectralnorm, 10, 1.2718440192507248), new Array(spectralnorm, 10, 1.8718440192507248));
console.log("running tests");
doTests(jobs);

