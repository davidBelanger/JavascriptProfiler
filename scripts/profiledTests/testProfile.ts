

class Car {
    engine: string;
    constructor (engine: string) {
        this.engine = engine;
    }
}






class Profiler {
	private mod_code : string;
	private globalStack: string[];
	
	private profilers: ProfilerMap;

	constructor(orig_code){
		this.profilers = new ProfilerMap();
		this.globalStack = Array();
		this.globalStack.push("root");

	}
	
	public getProfile(name: string): Profile {
//	       return new Profile(name,this);
	       return this.profilers.getOrElseNew(name,this);
	}

	public pushAndGetParent(n: string): string {
	        var idx =  this.globalStack.push(n);
		return this.globalStack[idx - 2].toString();
	}
	public popStack(): void {this.globalStack.pop();}
	public printStack(): string {return this.globalStack.toString()}
}




class ProfilerMap{
      private keys: string[];
      private values: Profile[];
      private numElts: number;

      constructor(){
	this.keys = Array();
	this.values = Array();
	this.numElts = 0;
      }
      public getOrElseNew(n: string, prof: Profiler): Profile {
      	     for(var i = 0; i < this.numElts; i++){
	     	   if(this.keys[i] === n){
		   	      return this.values[i];
		   }	   
	     }
	     this.numElts += 1;
	     this.keys.push(n);
	     console.log('making new profiler for ' + n);
	     var np = new Profile(n, prof);
	     this.values.push(np);
	     return np;
      }
      
}

class Profile{

    private name: string;
    private startTime: number;
    private parentCaller: string;
    private profiler: Profiler;
    
    constructor(n: string,profiler: Profiler){
    	this.name = n;		    
	this.profiler = profiler;
    }
    public start(): void{
    	this.startTime = new Date().getTime();
	this.parentCaller = this.profiler.pushAndGetParent(this.name)
	
	console.log("starting " + this.name + ", called from " + this.parentCaller );
    }
    public end(): void {
    	var endTime = new Date().getTime()
        var timeElapsed = endTime  - this.startTime;
        this.profiler.popStack();
	console.log("ending " + this.name + " in time: " + timeElapsed + ", called from " +  this.parentCaller );
	console.log("stack = " + this.profiler.printStack());
    }
    public toString(): string { return "profiler: " + this.name;}
}



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
    console.log('here')

    profile.end();
    return toReturn;
}



function run(n): number{
    var name = 'run';
    var profile =  GlobalProfiler.getProfile(name); 

    profile.start();

    var tV = 0;
    for(var i = 0; i < n; i++){
  	var tV = F(i);
	console.log(tV);
   } 
   profile.end();
   return tV;
 
}


function driver(): void  {
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
}


//var pmap = new ProfilerMap('n');
var GlobalProfiler = new Profiler("")


driver();




