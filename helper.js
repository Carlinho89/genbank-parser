function paint(string,start,end,color) {
	console.log(string);
	string = removeFormatting(string);
	arr = string.split("");
	text = "";
	for(i=0;i<string.length;i++) {
		if(i==start) { text = text + "<span style='background-color:"+color+"'>";} else if(i==end) { text = text + '</span>' } 		text = text + arr[i];
	}
	document.getElementById('sequence').innerHTML = text;
	return text;
}

function removeFormatting(string){ 
return string;
}