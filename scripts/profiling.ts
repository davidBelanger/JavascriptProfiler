var fs = require('fs');
declare function require(name:string);
var esprima = require("esprima");
var escodegen = require("escodegen");


class ProfilerFromSource{
	private mod_code : string;
	public profiler: Profiler;
	public test: () => string;
	//var GlobalProfiler: Profiler;
	constructor(orig_code: string, testMode: boolean = false){

	    

	    var prog_tree = esprima.parse(orig_code);
	    node_apply(prog_tree,modify_func);//apply modifications here
	    
	    this.mod_code = escodegen.generate(prog_tree);

	    //console.log('profiling ' + this.mod_code);
	    var callback: () => string; 
	    this.profiler = new Profiler(callback);

	    if(testMode === true){
	     callback = function (): string {var GlobalProfiler = this.profiler; eval(this.mod_code); return eval('doTest()');};   	//todo: change
//	     callback = function (): string {var f = new Function(this.mod_code); f(); return 'change';};   	//todo: change

	    }else{
	     callback = function (): string {var f = new Function(this.mod_code);  f(); return 'change'};		   
	    }
	    var GlobalProfiler = this.profiler;

	    this.profiler.thingToRun = callback;
	    
	    this.test = callback;
	    console.log('mc = ' + this.mod_code)	
	}
	public runProfiling(): string { return this.profiler.runProfile();}
}


class Profiler {
	private globalStack: string[];
	
	private profilers: ProfilerMap;
	public thingToRun: () => string;

	constructor(callback: () => string){
		this.profilers = new ProfilerMap();
		this.globalStack = Array();
		this.globalStack.push("root");
  		this.thingToRun = callback;		      
	}


	public runProfile(): string{
	     //console.log('running' + this.thingToRun);  
	     var toReturn = this.thingToRun();

	     console.log("\nPER-FUNCTION PROFILING INFO")
	     var profs = this.profilers.getProfiles();
	     var numericalCriteria = new Array(function (p: Profile): number {return p.numInvocations;} , 
	     	 		     	 function (p: Profile): number {return p.totalTime;}); 
	     var histogramNames = new Array('Num Invocations', 'Total Time');				 
	     for(var i = 0; i < profs.length; i++){
	     	     console.log(profs[i].report())
	     }
	     for(var i = 0; i < numericalCriteria.length; i++){
	     	     console.log('\n' + histogramNames[i]);
	     	     console.log(this.makeNumericalHistogram(numericalCriteria[i],profs))
	     }

	     return toReturn;  
	}
	
	private makeNumericalHistogram(f: (Profile) => number, profs: Profile[]): string {
		var total: number = 0;	  
		var np = profs.length;
		var arr = new Array(np);
		for(var i = 0; i < np; i++){
			arr[i] = f(profs[i]);
			total += arr[i];
		}
		var str: string = "";

		var sortedIndices = this.getSortedIndices(arr);
		for(var i = 0; i < np; i++){
			var is = sortedIndices[i];
			str += profs[is].name + " " + (arr[is]/total) + "\n";
		}
		
		return str;
	}
	public getSortedIndices(arr: number[]): number[]{
	        var np = arr.length;
		var indices = new Array(np);
		for(var i = 0; i < np; i++) indices[i] = i;

		indices.sort(function (x,y) {return arr[x] - arr[y]});

		return indices;
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

    public name: string;
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



/////********The stuff below this is for transforming code to be instrumented********/////
// applies func to all nodes in the tree
function node_apply(tree,func) {
    for (var key in tree) {
        if (tree.hasOwnProperty(key)) {
            var child = tree[key];
            if (typeof child === 'object' && child !== null) {

                if (Array.isArray(child)) {
                    child.forEach(function(c) {
                        node_apply(c,func);
                    });
                } else {
                    node_apply(child,func);
                }
            }
        }
    }
	func(tree);
}

function modify_func(node){
	// If node is a standard function declaration 
	// insert enter code at the beginning and 
	// exit code at the end.
	if(node["type"] == "FunctionDeclaration")
	{
		var fname = node["id"]["name"]
		var ent_code = "var fun_prof = GlobalProfiler.getProfile(\""+fname+"\");fun_prof.start();"
		var ex_code = "fun_prof.end();"
		node["body"]["body"] = esprima.parse(ent_code)["body"].concat(node["body"]["body"],esprima.parse(ex_code)["body"])
	}
	// If node is a function expression 
	// insert enter code at the beginning and 
	// exit code at the end.
	else if(node["type"] == "FunctionExpression")
	{
		var fname : any;
		fname = "anon func";
		//mod exp
		if(node["id"] != null)
		{
			var fname = node["id"]["name"];
		}
		var ent_code = "var fun_prof = new Profile(\""+fname+"\");fun_prof.start();";
		var ex_code = "fun_prof.end();";
		node["body"]["body"] = esprima.parse(ent_code)["body"].concat(node["body"]["body"],esprima.parse(ex_code)["body"]);
	}
	// If node is a return statement, store the return value 
	// (possibly null) to profile_tmp, execute exit code 
	// and return profile_tmp (again possibly null).
	else if(node["type"] == "ReturnStatement")
	{
		node["body"] = []
		node["body"].push({
                        "type": "VariableDeclaration",
                        "declarations": [
                            {
                                "type": "VariableDeclarator",
                                "id": {
                                    "type": "Identifier",
                                    "name": "profiler_tmp"
                                },
                                "init": node["argument"]
                            }
                        ],
                        "kind": "var"
                    })
		node["body"].push(esprima.parse("fun_prof.end();")["body"][0])
		node["body"].push({
							"type": "ReturnStatement",
							"argument": {
								"type": "Identifier",
								"name": "profiler_tmp"
							}
						})
		node["type"] = "BlockStatement"
	}
}


