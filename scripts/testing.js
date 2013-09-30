function doTests(jobs){
    for(i = 0; i < jobs.length; i++){
	thisJob = jobs[i];
	test(thisJob);
	analyze(thisJob);
    }

}

function analyze(thisJob){
    console.log("expected " + thisJob[2]);
    console.log("got" + thisJob[0](thisJob[1]));
}

function test(thisJob){
    equal(thisJob[0](thisJob[1]),thisJob[2]);
	
}

function equal(a,b){
    if(a !== b){
	console.log("WARNING: TEST FAILED");
    }
}