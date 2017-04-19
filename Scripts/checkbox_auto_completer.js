input_elements = document.getElementsByTagName('input');

// Also add 'displayInReport' to check that one as well
wordList = ['compulsory', 'allowProvided'];

for (index = 0; index < input_elements.length; ++index) {
    if (input_elements[index].type == 'checkbox' && wordList.indexOf(input_elements[index].name) >= 0){
        input_elements[index].checked = true;
    }
}
