var fs = require('fs');

// file is included here:
eval(fs.readFileSync('scripts/profiledTests/profiling.js')+'');



function F(n) {
    var name = 'F';
    var profile = GlobalProfiler.getProfile(name); 

    profile.start();
    var toReturn =  1;
    for(var j = 0; j < 1000000*n; j++){
    	    if(j % 2 == 1){
    	    	 toReturn += Math.sqrt(j);
		 }
		else{
		toReturn -= Math.sqrt(j);
		}

    }

    profile.end();
    return toReturn;
}

function G(n) {
    var name = 'G';
    var profile = GlobalProfiler.getProfile(name); 

    profile.start();
    var toReturn =  1;
    for(var j = 0; j < 1000000*n; j++){
    	    if(j % 2 == 1){
    	    	 toReturn +=(j);
		 }
		else{
		toReturn -= (j);
		}

    }

    profile.end();
    return toReturn;
}


function run(n){
    var name = 'run';
    var profile =  GlobalProfiler.getProfile(name); 

    profile.start();

    var tV = 0;
    for(var i = 0; i < n; i++){
  	var tV = F(i);
	var tV2 = G(i);
   } 
   profile.end();
   return tV;
 
}


function driver(){
	 var name = 'driver';
	 var profile = GlobalProfiler.getProfile(name); 
	 profile.start()

	 	  var v1 = run(6);
		  console.log(" got "  + v1);
		  var v2 = run(7);
		  console.log(" got "  + v2);
		  var v3 = run(1);
		  console.log("got " + v3);
		

         profile.end();	 
	 return v3.toString();
}






var GlobalProfiler = new Profiler(driver)
GlobalProfiler.runProfile();
