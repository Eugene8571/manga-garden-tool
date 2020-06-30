// var app = chrome.runtime.getBackgroundPage();

// function hello() {
//   chrome.tabs.executeScript({
//     file: 'alert.js'
//   }); 

// }

document.getElementById('picker_btn').addEventListener('click', function() {
  chrome.tabs.executeScript({
    file: 'alert.js'
  }); 

});