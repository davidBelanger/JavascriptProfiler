
var globalStack = Array();
globalStack.push("root");

class Profile{
    private name: string;

    constructor(n: string){
    	name = n;
    }
    public start(): void{
        var idx =  globalStack.push(name);
	var parentName = globalStack[idx - 2];	
	console.log("starting " + name + ", called from " + parentName);
    }
    public end(): void {
	console.log("ending " + name);
    }
}



function F(n) {
    this.name = 'F';
    this.profile = new Profile(this.name);
    function run(n) {
    this.profile.start();
    var toReturn = n + 5;
    this.profile.end();
    return toReturn;
 }
 return run(n);
}


function run(n): void{
    this.name = 'run';
    this.profile = new Profile(this.name);
    function run2(n){
    this.profile.start();
         for(var i = 0; i < n; i++){
     	     console.log(F(i))
    	}
    this.profile.end();
 }
 run2(n)
}


function driver(): void  {
	 this.name = 'driver';
	 this.profile = new Profile(this.name);
	 this.profile.start()
	 function run3(): void {
	 	  run(6);
		  console.log('did');
		  run(7);
	 }
	 run3();	 
}

driver();
console.log("flush");