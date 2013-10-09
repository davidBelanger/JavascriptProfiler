
var globalStack = Array();
globalStack.push("root");


class Profile{
    private name: string;
    private startTime: number;
    constructor(n: string){
    	name = n;
    }
    public start(): void{
    	this.startTime = new Date().getTime();
	console.log("starting at " + this.startTime)
        var idx =  globalStack.push(name);
	var parentName = globalStack[idx - 2];	
	console.log("starting " + name + ", called from " + parentName );
    }
    public end(): void {
    	var endTime = new Date().getTime()
    	console.log("start = " + this.startTime + " end = " + endTime )
        var timeElapsed = endTime  - this.startTime;
        globalStack.pop();
	console.log("ending " + name + " in time: " + timeElapsed);
    }
}



function F(n) {
    this.name = 'F';
    this.profile = new Profile(this.name); 

    this.profile.start();
    
    var toReturn =  1;
    for(var j = 0; j < 1000000*n; j++){
    	    if(j % 2 == 1){
    	    	 toReturn += Math.sqrt(j);
		 }
		else{
		toReturn -= Math.sqrt(j);
		}

    }
    this.profile.end();
    return toReturn;
}



function run(n): void{
    this.name = 'run';
    this.profile = new Profile(this.name);

    this.profile.start();
    for(var i = 0; i < n; i++){
  	console.log(F(i))
   }
   this.profile.end();
 
 
}


function driver(): void  {
	 this.name = 'driver';
	 this.profile = new Profile(this.name);
	 this.profile.start()
	 	  run(6);
		  console.log('did');
		  run(7);

         this.profile.end();	 
}

driver();
console.log("flush");