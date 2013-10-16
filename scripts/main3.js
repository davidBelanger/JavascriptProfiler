var fs = require('fs');

// file is included here:
eval(fs.readFileSync('scripts/profiling.js')+'');


tests = new Array()
//tests.push(new Array('scripts/testScripts/spect.js'))
tests.push(new Array('scripts/testScripts/nbody.js'))
tests.push(new Array('scripts/testScripts/fannkuch.js'))

for(i = 0; i < tests.length; i++){
    var t = tests[i];
    var file = t[0];
    console.log('\n\nProfiling ' + file);

    var inputScriptString = fs.readFileSync(file)+'';
    var prof = new ProfilerFromSource(inputScriptString,true);
    var getOriginalOutput = function() {
	    return eval(inputScriptString+ "; doTest()");
	}
    
    var profiled1Func = function(){
	var result = prof.startUp();
	console.log(prof.getReport());
	return result;
    }

    var profiled =  profiled1Func()
    var orig = getOriginalOutput();

    assertEqual(orig,profiled);

}
    
    

function assertEqual(a,b){
    if(a != b){
	console.log("ERROR: TEST FAILED\ngot " + a + " and " + b);
    }else{
	console.log("TEST PASSED");
    }
}

