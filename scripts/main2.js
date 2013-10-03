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

    var inputScriptString = fs.readFileSync(file)+'';
    var modifiedSource = inputScriptString; //todo: modify it to be instrumented
    
    var sourceStrings = new Array(inputScriptString,modifiedSource);
    var results = new Array;
    for(j = 0; j < 2; j++){
	var str = sourceStrings[j];
	function run(st) {
	    eval(st);
	    var output = eval(driverFunction + "(" + input + ")");
	    return output;
	}
	var result = run(str);
	results[j] = result;
	console.log('got ' + 	result + " for " + file + " with setting " + j);

	run(str);
    }
    assertEqual(results[0],results[1]);
    
}

function assertEqual(a,b){
    if(a != b){
	console.log("ERROR: TEST FAILED");
    }
}

