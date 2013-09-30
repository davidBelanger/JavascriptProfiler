function doTests(jobs){
    for(i = 0; i < jobs.length; i++){
	thisJob = jobs[i];
	test(thisJob);
    }

}


function test(thisJob){
    var got = thisJob[0](thisJob[1]);
    var expected = thisJob[2];

    if(got != expected){
	console.log(" for " + thisJob[3] +  ": expected " + expected + ", but got " + got);
    }else{
	console.log(thisJob[3] + " passed" );
    }
	
}
