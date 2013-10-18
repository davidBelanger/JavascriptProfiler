var fs = require('fs');
declare function require(name:string);
var esprima = require("esprima");
var escodegen = require("escodegen");


class ProfilerFromSource{
	public mod_code : string;
	public profiler: Profiler;
	public test: () => string;


	//var GlobalProfiler: Profiler;
	constructor(orig_code: string, testMode: boolean = false){

	    

	    var prog_tree = esprima.parse(orig_code,{"loc":true});
	    node_apply(prog_tree,modify_func);//apply modifications here
	    
		// console.log(JSON.stringify(prog_tree, null, 4));
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
	public startUp(): string { return this.profiler.startUp();}
	public getReport(): string {return this.profiler.getReport();}

}


class Profiler {
	private globalStack: string[];
	private childTimerAccumulator: number[];
	
	private profilers: ProfilerMap;
	public thingToRun: () => string;
	private edges: string[];
	private pathsFromRoot: string[];

	constructor(callback: () => string){
		this.profilers = new ProfilerMap();
		this.globalStack = Array();
		this.edges = Array();
		this.globalStack.push("root");
		this.childTimerAccumulator = Array();
		this.childTimerAccumulator.push(0);
  		this.thingToRun = callback;	
		this.pathsFromRoot = Array();	      
	}


	public startUp(): string{
	     var toReturn = this.thingToRun();
	     return toReturn;
	     }
	public getReport(): string { 
	     var profs = this.profilers.getProfiles();

	     var toReturn = "";
	     ////////Specify all the profiling info to print out here
	     var numericalCriteria = new Array(function (p: Profile): number {return p.numInvocations;} , 
	     	 		     	 function (p: Profile): number {return p.totalTime/p.numInvocations;},
					 function (p: Profile): number {return p.adjustedTotalTime/p.numInvocations;}); 
	     var numericalHistogramNames = new Array('Num Invocations', 'Average Time Below','Average Self Time');				 
	     
	     ////////

	     for(var i = 0; i < profs.length; i++){
	     	     toReturn += profs[i].report() + "\n";
	     }
	     for(var i = 0; i < numericalCriteria.length; i++){
	     	     toReturn += '\n' + numericalHistogramNames[i] + "(sorted by percentage) " + "\n";

	     	     toReturn += this.makeNumericalHistogram(numericalCriteria[i],profs) + "\n";
		     var divId = '#container' + i;
	     this.makeAwesomeHistogram(numericalCriteria[i],profs, divId,numericalHistogramNames[i]);

	     }

	     
	    toReturn += 'Top 10 Hot Call Edges (parent --> child)\n' + this.makeCategoricalHistogram(this.edges,10) + "\n";

	     toReturn += 'Top 10 Hot Paths from Root\n' + this.makeCategoricalHistogram(this.pathsFromRoot,10) + "\n";
	     
	     //console.log(toReturn);

	     return toReturn;  
	}

	private makeAwesomeHistogram(f: (Profile) => number, profs: Profile[],divId: string, name: string): void {
			var total: number = 0;	  
		var np = profs.length;
		var arr = new Array(np);
		for(var i = 0; i < np; i++){
			arr[i] = f(profs[i]);
			total += arr[i];
		}
		var mySeries = Array();
		for(var i = 0; i < np; i++){
			mySeries.push({name: profs[i].name,data: [arr[i]/total]})
		}
	
       $(function () { 
		     $(divId).highcharts({
plotOptions: {
                bar: {
                    animation: false
                }
            },
        chart: {     
            type: 'bar'
        },
        title: {
            text: name
        },
        xAxis: {
            //categories: ['Apples']
        },
        yAxis: {
            title: {
                text: 'Percentage'
            }
        },
        series: mySeries
    });
});
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
		var total = arr.length;
		indices.sort(function (x,y) {return counts[keys[y]] - counts[keys[x]]});
		var toReturn = "name\t\tnumber\t\tpercentage of total\n";

		for(var i = 0; i < Math.min(numTake,np);i++){
			var idx = indices[i];
			toReturn += keys[idx] +  "\t\t" + counts[keys[idx]] +"\t\t" + (100*counts[keys[idx]]/total) + "%\n" ;	
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
		var str: string = "name\t\tamount\t\tpercentage of total\n";

		var sortedIndices = this.getSortedIndices(arr);
		for(var i = 0; i < np; i++){
			var is = sortedIndices[i];
			str += profs[is].name + "\t\t" + (arr[is]) + "\t\t"+  (100*arr[is]/total) + "%\n";
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
		this.childTimerAccumulator.push(0);
		var parent = this.globalStack[idx - 2].toString();
		this.edges.push(parent + "-->" + n);
		
		var start =  this.globalStack.length - 11;
		var bottomOfStack = this.globalStack.slice(start);
		this.pathsFromRoot.push(bottomOfStack.toString());
		return parent;
	}
	public endJob(elapsedTime: number): number {this.globalStack.pop(); var timeBelow = this.childTimerAccumulator.pop() ;var len = this.childTimerAccumulator.length; this.childTimerAccumulator[len - 1] += elapsedTime; return timeBelow; }
	public printStack(): string {return this.globalStack.toString();}
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
    public adjustedTotalTime: number;
    
    constructor(n: string,profiler: Profiler){
    	this.name = n;		    
	this.profiler = profiler;
	this.numInvocations = 0;
	this.totalTime = 0;
	this.adjustedTotalTime = 0;
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
        var totalChildTimes = this.profiler.endJob(timeElapsed);
	this.adjustedTotalTime += (timeElapsed - totalChildTimes);
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
	else if(node["type"] == "CallExpression")
	{
		var call_name = node["callee"]["name"]
		if(call_name == "setTimeout" || call_name == "setInterval")
		{
			var cb_fun = escodegen.generate(node["arguments"][0]);
			var scb_name = call_name+"_line_"+ + node["loc"]["start"]["line"] + "_col_" + node["loc"]["start"]["column"];
			var new_arg = "(function(foo){return (function(){var acb_name = \""+scb_name+"\"; var fun_prof = GlobalProfiler.getProfile(acb_name);fun_prof.start();foo();fun_prof.end();})})("+cb_fun+")";
			var new_arg_tree = esprima.parse(new_arg)["body"][0]["expression"]
			
			// node["body"] = []
			// node["body"].push({
							// "type": "VariableDeclaration",
							// "declarations": [
								// {
									// "type": "VariableDeclarator",
									// "id": {
										// "type": "Identifier",
										// "name": "profiler_cb_fun"
									// },
									// "init": new_arg_tree
								// }
							// ],
							// "kind": "var"
						// })
			// node["body"].push({
                // "type": "CallExpression",
                // "callee": {
                    // "type": "Identifier",
                    // "name": "setTimeout"
                // },
                // "arguments": [
                    // {
                        // "type": "Identifier",
                        // "name": "profiler_cb_fun"
                    // },
					// node["arguments"][1]
                // ]})
			node["arguments"][0] = new_arg_tree
		}
	}
}


