
chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
    function(tabs){
        let div = document.createElement('div');
        div.className = "add_title";
        var encoded = encodeURIComponent(tabs[0].url);
        div.innerHTML = "<h3><a id='add_title_link' \
        class='badge' target='_blank' \
        href='http://manga.garden/add_title?url=" + encoded + "'>+</a></h3>";

        document.body.append(div);
    }
);

