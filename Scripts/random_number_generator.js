input_elements = document.getElementsByTagName('input');
for (index = 0; index < input_elements.length; ++index) {
    input_elements[index].value = Math.floor((Math.random() * 1000) + 1);;
	input_elements[index].val = Math.floor((Math.random() * 10000) + 1);
}
