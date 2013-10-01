var fs = require('fs');

// file is included here:
//eval(fs.readFileSync('scripts/helper/util.js')+'');
eval(fs.readFileSync('scripts/testing.js')+'');


tests = new Array()
tests.push(new Array('scripts/tests/nbody.js','runNBody',10))
tests.push(new Array('scripts/tests/spect.js','spectralnorm',10))

for(i = 0; i < tests.length; i++){
    var t = tests[i];
    var file = t[0];
    var driverFunction = t[1];
    var input = t[2];

    var inputScriptString = fs.readFileSync(file)+''
    eval(inputScriptString);
    var output = eval(driverFunction + "(" + input + ")");
    console.log('got ' + output + " for " + file);
    
    //todo: now transform inputScriptString and make sure you get the same output
    
    
}


