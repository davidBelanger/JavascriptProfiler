function foo(a,b)
{
	return a(b);
}

function bar(a)
{
	console.log(arguments.callee.caller.toString());
	console.log(a)
}

foo(bar,2)

setTimeout(bar,1000)