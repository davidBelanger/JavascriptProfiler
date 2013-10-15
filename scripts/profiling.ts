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

	    

	    var prog_tree = esprima.parse(orig_code,{"loc":true});
	    node_apply(prog_tree,modify_func);//apply modifications here
	    
	    this.mod_code = escodegen.generate(prog_tree);

	    var callback: () => string; 
	    this.profiler = new Profiler(callback);
	    var GlobalProfiler = this.profiler;
	    var mc = this.mod_code;

	    if(testMode === true){
	     callback = function (): string {return eval(mc+ "; doTest()")};  

	    }else{
	     callback = function (): string {return eval(mc);};		   
	    }

	    this.profiler.thingToRun = callback;
	    
	    this.test = callback;
	}
	public runProfiling(): string { return this.profiler.runProfile();}
}


class Profiler {
	private globalStack: string[];
	
	private profilers: ProfilerMap;
	public thingToRun: () => string;
	private edges: string[];
	private pathsFromRoot: string[];

	constructor(callback: () => string){
		this.profilers = new ProfilerMap();
		this.globalStack = Array();
		this.edges = Array();
		this.globalStack.push("root");
  		this.thingToRun = callback;	
		this.pathsFromRoot = Array();	      
	}


	public runProfile(): string{
	     var toReturn = this.thingToRun();

	     
	    // console.log("\nPER-FUNCTION PROFILING INFO")
	     var profs = this.profilers.getProfiles();

	     ////////Specify all the profiling info to print out here
	     var numericalCriteria = new Array(function (p: Profile): number {return p.numInvocations;} , 
	     	 		     	 function (p: Profile): number {return p.totalTime;}); 
	     var numericalHistogramNames = new Array('Num Invocations', 'Total Time');				 
	     
	     ////////

	     for(var i = 0; i < profs.length; i++){
	     	     console.log(profs[i].report())
	     }
	     for(var i = 0; i < numericalCriteria.length; i++){
	     	     console.log('\n' + numericalHistogramNames[i] + "(sorted by amount)");
	     	     console.log(this.makeNumericalHistogram(numericalCriteria[i],profs))
	     }
	     
	     console.log('Top 10 Hot Call Edges (parent --> child)\n' + this.makeCategoricalHistogram(this.edges,10))

	     console.log('Top 10 Hot Paths from Root\n' + this.makeCategoricalHistogram(this.pathsFromRoot,10))
	     

	     return toReturn;  
	}

	private makeCategoricalHistogram(arr: string[], numTake: number = 10): string {
		var counts = {};
		for(var i = 0; i < arr.length; i++){
			var key = arr[i];
			if(counts[key] == undefined) counts[key] = 0;
			counts[key] +=1;	
		}
		var keys = Object.keys(counts);
		var np = keys.length 
		var indices = new Array(np);
		for(var i = 0; i < np; i++) indices[i] = i;

		indices.sort(function (x,y) {return counts[keys[y]] - counts[keys[x]]});
		var toReturn = "";
		for(var i = 0; i < Math.min(numTake,np);i++){
			var idx = indices[i];
			toReturn += keys[idx] +  " " + counts[keys[idx]] + "\n" ;	
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

		indices.sort(function (x,y) {return arr[y] - arr[x]});

		return indices;
	}
	public getProfile(name: string): Profile {
	       return this.profilers.getOrElseNew(name,this);
	}

	public pushAndGetParent(n: string): string {
	        var idx =  this.globalStack.push(n);
		var parent = this.globalStack[idx - 2].toString();
		this.edges.push(parent + "-->" + n);
		this.pathsFromRoot.push(this.globalStack.toString())
		return parent;
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
	// for each child of the root
    for(var edge in tree) {
		if(tree.hasOwnProperty(edge))
		{
			var child = tree[edge];
			// if child is an array of nodes (as in a blockstatement or function body)
			if(Array.isArray(child))
			{
				for(var i = 0; i < child.length; ++i)
				{
					node_apply(child[i],func);
				}
			}
			// if child is an associative array
			else if(typeof child === 'object' && child !== null)
			{
				node_apply(child,func);
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
		// code executed upon entry
		var ent_code = "var fun_prof = GlobalProfiler.getProfile(\""+fname+"\");fun_prof.start();"
		// code executed upon return
		var ex_code = "fun_prof.end();"
		node["body"]["body"] = esprima.parse(ent_code)["body"].concat(node["body"]["body"],esprima.parse(ex_code)["body"])
	}
	// If node is a function expression 
	// insert enter code at the beginning and 
	// exit code at the end.
	else if(node["type"] == "FunctionExpression")
	{
		var fname : any;
		//mod exp
		if(node["id"] != null)
		{
			fname = node["id"]["name"];
		}
		else
		{
			fname = "anon_line_" + node["body"]["loc"]["start"]["line"] + "_col_" + node["body"]["loc"]["start"]["column"]
		}
		// code executed upon entry
		var ent_code = "var fun_prof = GlobalProfiler.getProfile(\""+fname+"\");fun_prof.start();";
		// code executed upon return
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


