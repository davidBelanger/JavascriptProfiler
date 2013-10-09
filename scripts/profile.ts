declare function require(name:string);
var esprima = require("esprima");
var escodegen = require("escodegen");
var fs = require('fs');

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



// profiler class that modifes the code and containes various 
// program statistics
class Profiler {
	mod_code : string;
	constructor(orig_code){
		var prog_tree = esprima.parse(fs.readFileSync(orig_code));
		node_apply(prog_tree,modify_func);//apply modifications here
		console.log("here")
		this.mod_code = escodegen.generate(prog_tree);
	}
}

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
		var ent_code = "var fun_prof = new Profile(\""+fname+"\");fun_prof.start();"
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


//*********************************************
// TEST CODE
//*********************************************

// prints function name if called statically
// function print_func_name(node){
    // if(node["type"] == "CallExpression")
	// {
		// var callee = node["callee"];
		// if(callee["type"] == "MemberExpression")
		// {
			// console.log(callee["object"]["name"] + "." + callee["property"]["name"]);
		// }
		// if(callee["type"] == "Identifier")
		// {
			// console.log(callee["name"]);
		// }
	// }
// }

// var filename = "scripts/fun_defs.js"
// var prof = new Profiler(filename);
// console.log("*----------------------------------------------------*")
// console.log(prof.mod_code)
// console.log("*----------------------------------------------------*")
// eval(prof.mod_code)