JavascriptProfiler
==================

A javascript profiler in written in javascript. Class project for Emery Berger.

Usage:

	There are two ways to use the profiler. One is for quick profiling of programs
	that don't interact with the DOM. The other is for more involved profiling of 
	JavaScript as part of a HTML application.

	Case 1 (profiler.html):
		
			For quick profiling, simply open profiler.html in any browser, paste 
		the code you would like to profile into the first text box and hit "Submit". 
		Profile information will be shown below the code.

	Case 2 (gen_prof_code.html):
		
			To profile more interactive code, open gen_prof_code.html in any browser, 
		paste in the code you would like to profile into the first text box, and hit 
		"Submit". The application will generate instrumented code and output it to the 
		second text box. This code can be used interchangeably with the original code. 
		To run the profiler, replace the original code with the new modified code, 
		import profiling.js, and launch the original application. An example is shown 
		below:

	Old HTML:

		<html>
		<body>
		<script language=javascript>
			function foo(){return 5}
			foo()
		</script>
		</body>
		</html>

	New HTML:

		<html>
		<body>
		<script src="scripts/profiling.js"> </script>
		<script language=javascript>
			GlobalProfiler = new Profiler();
			setInterval(function(){console.log(GlobalProfiler.getStringReport())},1000);
			function foo() {
				var fun_prof = GlobalProfiler.getProfile('foo');
				fun_prof.start();
				{
					var profiler_tmp = 5;
					fun_prof.end();
					return profiler_tmp;
				}
				fun_prof.end();
			}
			foo();
		</script>
		</body>
		</html>
		
Compiling profiling.ts:
			
		While we provide profiling.js, code was written using typescript. If it becomes necessary to 
	compile new JS file from the original source this can be done using the typescript compiler 
	(available at http://www.typescriptlang.org/). Once installed, profiling.ts can be compiled using:
	
		tsc scripts/profiling.ts
		
	from the application base directory.

Testing:
		
		A set of scripts is provided for testing as well as a short HTML page the instruments the 
	test scripts, runs the modified scripts and the original scripts, and compares the outputs of 
	both. To run the tests, open testSuite.html in any browser. To see profile information for the 
	test scripts, simply copy the code in scripts/tests/*.js into the profiles.html interface and 
	hit "Submit".
	
	NOTE: Due to security features, to run testSuit.html in Chrome one must use the following command:
	
		chrome.exe --allow-file-access-from-files testSuite.html
		
Documentation:

		A full description of functionality and design is located in doc/writeup.tex. To compile 
	this file to a pdf, simply call:
		
		pdflatex doc/writeup.tex
	
	from the root application directory.
	
Dependencies:
	
		The profiler depends on the jquery, highcharts, esprima, and escodegen libraries. jquery and highcharts 
	are retrieved from their respective websites and esprima and escodegen are provided in the scripts/ directory. 
	it is unnecessary to install any other libraries.
	
