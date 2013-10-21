var ProfilerFromSource = (function () {
    //var GlobalProfiler: Profiler;
    function ProfilerFromSource(orig_code, testMode) {
        if (typeof testMode === "undefined") { testMode = false; }
        var prog_tree = esprima.parse(orig_code, { "loc": true });
        node_apply(prog_tree, modify_func);

        this.mod_code = escodegen.generate(prog_tree);
        var callback;
        this.profiler = new Profiler(callback);
        var GlobalProfiler = this.profiler;
        var mc = this.mod_code;

        if (testMode === true) {
            callback = function () {
                return eval(mc + "; doTest()");
            };
        } else {
            callback = function () {
                return eval(mc);
            };
        }

        this.profiler.thingToRun = callback;

        this.test = callback;
    }
    ProfilerFromSource.prototype.startUp = function () {
        return this.profiler.startUp();
    };
    ProfilerFromSource.prototype.getReport = function () {
        return this.profiler.getReport();
    };
    ProfilerFromSource.prototype.getStringReport = function () {
        return this.profiler.getStringReport();
    };
    ProfilerFromSource.prototype.getCodeFile = function () {
        return "GlobalProfiler = new Profiler();\nsetInterval(function(){console.log(GlobalProfiler.getStringReport())},1000);\n" + this.mod_code;
    };
    return ProfilerFromSource;
})();

var Profiler = (function () {
    function Profiler(callback) {
        this.profilers = new ProfilerMap();
        this.globalStack = Array();
        this.edges = Array();
        this.globalStack.push("root");
        this.childTimerAccumulator = Array();
        this.childTimerAccumulator.push(0);
        this.thingToRun = callback;
        this.pathsFromRoot = Array();
    }
    Profiler.prototype.startUp = function () {
        var toReturn = this.thingToRun();
        return toReturn;
    };
    Profiler.prototype.getReport = function () {
        var profs = this.profilers.getProfiles();

        var toReturn = "";

        ////////Specify all the profiling info to print out here
        var numericalCriteria = new Array(function (p) {
            return p.numInvocations;
        }, function (p) {
            return p.totalTime / p.numInvocations;
        }, function (p) {
            return p.adjustedTotalTime / p.numInvocations;
        });
        var numericalHistogramNames = new Array('Num Invocations (% of total Invocations)', 'Average Time Below (% of total time in instrumented functions)', 'Average Self Time (% of total time in instrumented functions)');

        for (var i = 0; i < numericalCriteria.length; i++) {
            var divId = '#container' + i;
            this.makeAwesomeHistogram(numericalCriteria[i], profs, divId, numericalHistogramNames[i]);
        }

        this.makeAwesomeCategoricalHistogram(this.edges, 5, '#container10', 'Top Hot parent --> child Call Edge Frequencies (% of total edge calls)');

        this.makeAwesomeCategoricalHistogram(this.pathsFromRoot, 5, '#container11', 'Top Hot Paths from Root (% of all distinct paths from root)');

        return toReturn;
    };

    Profiler.prototype.makeAwesomeHistogram = function (f, profs, divId, name) {
        var total = 0;
        var np = profs.length;
        var arr = new Array(np);
        for (var i = 0; i < np; i++) {
            arr[i] = f(profs[i]);
            total += arr[i];
        }
        var mySeries = Array();
        for (var i = 0; i < np; i++) {
            mySeries.push({ name: profs[i].name, data: [100 * arr[i] / total] });
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
                xAxis: {},
                yAxis: {
                    title: {
                        text: 'Percentage'
                    }
                },
                series: mySeries
            });
        });
    };

    Profiler.prototype.makeAwesomeCategoricalHistogram = function (arr, numTake, divId, name) {
        var counts = {};
        for (var i = 0; i < arr.length; i++) {
            var key = arr[i];
            if (counts[key] == undefined)
                counts[key] = 0;
            counts[key] += 1;
        }
        var keys = Object.keys(counts);
        var np = keys.length;
        var indices = new Array(np);
        for (var i = 0; i < np; i++)
            indices[i] = i;
        var total = arr.length;
        indices.sort(function (x, y) {
            return counts[keys[y]] - counts[keys[x]];
        });
        var toReturn = "name\t\tnumber\t\tpercentage of total\n";

        var mySeries = Array();
        for (var i = 0; i < Math.min(numTake, np); i++) {
            var idx = indices[i];
            var nam = keys[idx];
            var dat = 100 * counts[keys[idx]] / total;
            mySeries.push({ name: nam, data: [dat] });
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
                xAxis: {},
                yAxis: {
                    title: {
                        text: 'Percentage'
                    }
                },
                series: mySeries
            });
        });
    };

    Profiler.prototype.getStringReport = function () {
        var profs = this.profilers.getProfiles();

        var toReturn = "";

        ////////Specify all the profiling info to print out here
        var numericalCriteria = new Array(function (p) {
            return p.numInvocations;
        }, function (p) {
            return p.totalTime / p.numInvocations;
        }, function (p) {
            return p.adjustedTotalTime / p.numInvocations;
        });
        var numericalHistogramNames = new Array('Num Invocations (% of total Invocations)', 'Average Time Below (% of total time in instrumented functions)', 'Average Self Time (% of total time in instrumented functions)');

        for (var i = 0; i < profs.length; i++) {
            toReturn += profs[i].report() + "\n";
        }
        for (var i = 0; i < numericalCriteria.length; i++) {
            toReturn += '\n' + numericalHistogramNames[i] + "(sorted by percentage) " + "\n";

            toReturn += this.makeNumericalHistogram(numericalCriteria[i], profs) + "\n";
        }

        toReturn += 'Top Hot parent --> child Call Edge Frequencies (% of total edge calls)\n' + this.makeCategoricalHistogram(this.edges, 5) + "\n";

        toReturn += 'Top Hot Paths from Root (% of all distinct paths from root)\n' + this.makeCategoricalHistogram(this.pathsFromRoot, 5) + "\n";

        return toReturn;
    };

    Profiler.prototype.makeNumericalHistogram = function (f, profs) {
        var total = 0;
        var np = profs.length;
        var arr = new Array(np);
        for (var i = 0; i < np; i++) {
            arr[i] = f(profs[i]);
            total += arr[i];
        }
        var str = "name\t\tamount\t\tpercentage of total\n";

        var sortedIndices = this.getSortedIndices(arr);
        for (var i = 0; i < np; i++) {
            var is = sortedIndices[i];
            str += profs[is].name + "\t\t" + (arr[is]) + "\t\t" + (100 * arr[is] / total) + "%\n";
        }

        return str;
    };
    Profiler.prototype.getSortedIndices = function (arr) {
        var np = arr.length;
        var indices = new Array(np);
        for (var i = 0; i < np; i++)
            indices[i] = i;

        indices.sort(function (x, y) {
            return arr[y] - arr[x];
        });

        return indices;
    };

    Profiler.prototype.makeCategoricalHistogram = function (arr, numTake) {
        if (typeof numTake === "undefined") { numTake = 10; }
        var counts = {};
        for (var i = 0; i < arr.length; i++) {
            var key = arr[i];
            if (counts[key] == undefined)
                counts[key] = 0;
            counts[key] += 1;
        }
        var keys = Object.keys(counts);
        var np = keys.length;
        var indices = new Array(np);
        for (var i = 0; i < np; i++)
            indices[i] = i;
        var total = arr.length;
        indices.sort(function (x, y) {
            return counts[keys[y]] - counts[keys[x]];
        });
        var toReturn = "name\t\tnumber\t\tpercentage of total\n";

        for (var i = 0; i < Math.min(numTake, np); i++) {
            var idx = indices[i];
            toReturn += keys[idx] + "\t\t" + counts[keys[idx]] + "\t\t" + (100 * counts[keys[idx]] / total) + "%\n";
        }
        return toReturn;
    };

    Profiler.prototype.getProfile = function (name) {
        return this.profilers.getOrElseNew(name, this);
    };

    Profiler.prototype.pushAndGetParent = function (n) {
        var idx = this.globalStack.push(n);
        this.childTimerAccumulator.push(0);
        var parent = this.globalStack[idx - 2].toString();
        this.edges.push(parent + "-->" + n);

        var start = this.globalStack.length - 11;
        var bottomOfStack = this.globalStack.slice(start);
        this.pathsFromRoot.push(bottomOfStack.toString());
        return parent;
    };
    Profiler.prototype.endJob = function (elapsedTime) {
        this.globalStack.pop();
        var timeBelow = this.childTimerAccumulator.pop();
        var len = this.childTimerAccumulator.length;
        this.childTimerAccumulator[len - 1] += elapsedTime;
        return timeBelow;
    };
    Profiler.prototype.printStack = function () {
        return this.globalStack.toString();
    };
    Profiler.prototype.pushAsParent = function (name) {
        this.globalStack.push(name);
    };
    Profiler.prototype.popAsParent = function (name) {
        this.globalStack.pop();
    };
    return Profiler;
})();

var ProfilerMap = (function () {
    function ProfilerMap() {
        this.keys = Array();
        this.values = Array();
        this.numElts = 0;
    }
    ProfilerMap.prototype.getOrElseNew = function (n, prof) {
        for (var i = 0; i < this.numElts; i++) {
            if (this.keys[i] === n) {
                return this.values[i];
            }
        }
        this.numElts += 1;
        this.keys.push(n);
        var np = new Profile(n, prof);
        this.values.push(np);
        return np;
    };
    ProfilerMap.prototype.getProfiles = function () {
        return this.values;
    };
    return ProfilerMap;
})();

var Profile = (function () {
    function Profile(n, profiler) {
        this.name = n;
        this.profiler = profiler;
        this.numInvocations = 0;
        this.totalTime = 0;
        this.adjustedTotalTime = 0;
    }
    Profile.prototype.report = function () {
        return "function " + this.name + " invoked " + this.numInvocations + " times. Total time = " + this.totalTime;
    };

    Profile.prototype.start = function () {
        this.numInvocations++;
        this.startTime = new Date().getTime();
        this.parentCaller = this.profiler.pushAndGetParent(this.name);
    };

    Profile.prototype.end = function () {
        var endTime = new Date().getTime();
        var timeElapsed = endTime - this.startTime;
        this.totalTime += timeElapsed;
        var totalChildTimes = this.profiler.endJob(timeElapsed);
        this.adjustedTotalTime += (timeElapsed - totalChildTimes);
    };

    Profile.prototype.toString = function () {
        return "profiler: " + this.name;
    };
    return Profile;
})();

/////********The stuff below this is for transforming code to be instrumented********/////
// applies func to all nodes in the tree
function node_apply(tree, func) {
    for (var edge in tree) {
        if (tree.hasOwnProperty(edge)) {
            var child = tree[edge];

            if (Array.isArray(child)) {
                for (var i = 0; i < child.length; ++i) {
                    node_apply(child[i], func);
                }
            } else if (typeof child === 'object' && child !== null) {
                node_apply(child, func);
            }
        }
    }

    func(tree);
}

function modify_func(node) {
    if (node["type"] == "FunctionDeclaration") {
        var fname = node["id"]["name"];

        // code executed upon entry
        var ent_code = "var fun_prof = GlobalProfiler.getProfile(\"" + fname + "\");fun_prof.start();";

        // code executed upon return
        var ex_code = "fun_prof.end();";
        node["body"]["body"] = esprima.parse(ent_code)["body"].concat(node["body"]["body"], esprima.parse(ex_code)["body"]);
    } else if (node["type"] == "FunctionExpression") {
        var fname;

        if (node["id"] != null) {
            fname = node["id"]["name"];
        } else {
            fname = "anon_line_" + node["body"]["loc"]["start"]["line"] + "_col_" + node["body"]["loc"]["start"]["column"];
        }

        // code executed upon entry
        var ent_code = "var fun_prof = GlobalProfiler.getProfile(\"" + fname + "\");fun_prof.start();";

        // code executed upon return
        var ex_code = "fun_prof.end();";
        node["body"]["body"] = esprima.parse(ent_code)["body"].concat(node["body"]["body"], esprima.parse(ex_code)["body"]);
    } else if (node["type"] == "ReturnStatement") {
        node["body"] = [];
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
        });
        node["body"].push(esprima.parse("fun_prof.end();")["body"][0]);
        node["body"].push({
            "type": "ReturnStatement",
            "argument": {
                "type": "Identifier",
                "name": "profiler_tmp"
            }
        });
        node["type"] = "BlockStatement";
    } else if (node["type"] == "CallExpression") {
        var call_name = node["callee"]["name"];
        if (call_name == "setTimeout" || call_name == "setInterval") {
            var cb_fun = escodegen.generate(node["arguments"][0]);
            var scb_name = call_name + "_line_" + +node["loc"]["start"]["line"] + "_col_" + node["loc"]["start"]["column"];
            var new_arg = "(function(foo){return (function(){var acb_name = \"" + scb_name + "\";GlobalProfiler.pushAsParent(acb_name);foo();GlobalProfiler.popAsParent();})})(" + cb_fun + ")";
            var new_arg_tree = esprima.parse(new_arg)["body"][0]["expression"];
            node["arguments"][0] = new_arg_tree;
        }
    }
    // else if(node["type"] == "CallExpression" || node["type"] == "NewExpression")
    // {
    // var call_name = node["callee"]["name"]
    // if(call_name == "Function")
    // {
    // fname = "anon_line_" + node["callee"]["loc"]["start"]["line"] + "_col_" + node["callee"]["loc"]["start"]["column"]
    // // code executed upon entry
    // var ent_code = "\"var fun_prof = GlobalProfiler.getProfile(fn);fun_prof.start();\""
    // // code executed upon return
    // var ex_code = "\";fun_prof.end();\""
    // var old_arg = node["arguments"].pop();
    // var new_arg = "(function(foo,fn){var mcode = escodegen.generate(node_apply(esprima.parse(\"function(){\"+foo+\"}\"),modify_func)[\"body\"][\"body\"]); var ret = " + ent_code + " + mcode + " + ex_code + "; return ret;})(inp,\"" + fname + "\")";
    // var new_arg_tree = esprima.parse(new_arg)["body"][0]["expression"]
    // new_arg_tree["arguments"][0] = old_arg;
    // node["arguments"].push(new_arg_tree);
    // }
    // }
}
