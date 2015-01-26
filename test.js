var fs = require("fs");
var parser = require("./parser");
fs.readFile("sequence.gb", "utf8", function(err,d){
 var obj = parser(d	);
 console.log(obj);
 });