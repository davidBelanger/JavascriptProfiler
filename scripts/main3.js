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

    var inputScriptString = fs.readFileSync(file)+'';
    var prof = new ProfilerFromSource(inputScriptString,true);
    var getOriginalOutput = function() {
	    return eval(inputScriptString+ "; doTest()");
	}
    
    var profiled1Func = function(){
	this.GlobalProfiler = prof.profiler;
	eval(prof.mod_code);
    }

    var profiled =  prof.runProfiling()
    var orig = getOriginalOutput();

    console.log('got ' + orig + " and " + profiled);
    assertEqual(orig,profiled);

}
    
    

function assertEqual(a,b){
    if(a != b){
	console.log("ERROR: TEST FAILED");
    }
}

