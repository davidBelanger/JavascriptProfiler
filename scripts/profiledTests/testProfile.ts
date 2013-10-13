
class ProfilerFromSource{
	private mod_code : string;
	private profiler: Profiler;
	
	constructor(orig_code: string){
	    this.mod_code = orig_code;
	    var callback = function (): string {var f = new Function(this.mod_code); return f();}		   
	    this.profiler = new Profiler(callback);
	}
	public runProfile(): string {return this.profiler.runProfile();}
}

class Profiler {
	private mod_code : string;
	private globalStack: string[];
	
	private profilers: ProfilerMap;
	private thingToRun: () => string;

	constructor(callback: () => string){
		this.profilers = new ProfilerMap();
		this.globalStack = Array();
		this.globalStack.push("root");
  		this.thingToRun = callback;		      
	}


	public runProfile(): string{
	       
	     var toReturn = this.thingToRun();
	     console.log("PER-FUNCTION PROFILING INFO")
	     var profs = this.profilers.getProfiles();
	     var numericalCriteria = Array(function (p: Profile): number {return p.numInvocations} , function (p: Profile): number {return p.totalTime}); 

	     for(var i = 0; i < profs.length; i++){
	     	     console.log(profs[i].report())
	     }
	     for(var i = 0; i < this.numericalCriteria.length; i++){
	     	     console.log(makeNumericalHistogram(this.numericalCriteria[i],profs))
	     }

	     return toReturn;  
	}
	
	private makeNumericalHistogram(f: Profile => number, profs: Profile[]): string {
		var total: number = 0;	  
		var np = profs.length;
		var arr = new Array(np);
		for(var i = 0; i < np; i++){
			arr(i) = f(profs[i]);
			total += arr(i);
		}
		var str: string = "";
		for(var i = 0; i < np; i++){
			str += profs[i].name + " " + (arr(i)/total) + "\n";
		}
		//todo: somehow sort these
		return str;
	}

	public getProfile(name: string): Profile {
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
      public getProfiles(): Profile[] { return this.values;}
      
}

class Profile{

    private name: string;
    private startTime: number;
    private parentCaller: string;
    private profiler: Profiler;
    public numInvocations: number;
    public totalTime: number;
    
    constructor(n: string,profiler: Profiler){
    	this.name = n;		    
	this.profiler = profiler;
	this.numInvocations = 0;
	this.totalTime = 0;
    }


    public report(): string {
    	   return "function " + this.name + " invoked " + this.numInvocations + " times. Total time = " + this.totalTime;
    
    }

    public start(): void{
    	this.numInvocations++;
    	this.startTime = new Date().getTime();
	this.parentCaller = this.profiler.pushAndGetParent(this.name)
	
    }
    public end(): void {
    	var endTime = new Date().getTime()
        var timeElapsed = endTime  - this.startTime;
	this.totalTime += timeElapsed;
        this.profiler.popStack();
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


function run(n): number{
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


function driver(): string  {
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
