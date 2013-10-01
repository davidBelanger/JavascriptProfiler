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
    
    eval(fs.readFileSync(file)+'');
    var output = eval(driverFunction + "(" + input + ")");
    console.log('got ' + output + " for " + file);

}


