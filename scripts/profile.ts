declare function require(name:string);
var esprima = require("esprima");
var escodegen = require("escodegen");
var fs = require('fs');

// profiler class that modifes the code and containes various 
// program statistics
class profiler {
	mod_code : string;
	constructor(orig_code){
		var prog_tree = esprima.parse(fs.readFileSync(orig_code));
		node_apply(prog_tree,print_func_name);//apply modifications here
		this.mod_code = escodegen.generate(prog_tree);
	}
}

// applies func to all nodes in the tree
function node_apply(tree,func) {
	func(tree);
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
}

//*********************************************
// TEST CODE
//*********************************************

// prints function name if called statically
function print_func_name(node){
    if(node["type"] == "CallExpression")
	{
		var callee = node["callee"];
		if(callee["type"] == "MemberExpression")
		{
			console.log(callee["object"]["name"] + "." + callee["property"]["name"]);
		}
		if(callee["type"] == "Identifier")
		{
			console.log(callee["name"]);
		}
	}
}

var filename = "scripts/main2.js"
var prof = new profiler(filename);
console.log(prof.mod_code)