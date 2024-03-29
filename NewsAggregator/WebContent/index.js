// Newest news item is last
var itemStore = [];
var filters = [];
var webSocket;
var loading = true;

function onLoad() {	
	setupCategoryButtons();
	
	openSocket();
}

function addItem(item, isNew) {
	itemStore.push(item);
	
	var table = $("<table>");
	table.addClass("feed_item");
	
	var tableBody = $("<tbody>");
	table.append(tableBody);
	
	var trBody = $("<tr>");
	trBody.addClass("feed_item_body");
	tableBody.append(trBody);
	
	var tdImg = $("<td>");
	trBody.append(tdImg);
	
	var aImg = $("<a>");
	aImg.attr('href', item.link);
	aImg.attr('target', "_blank");
	tdImg.append(aImg);
	
	var img = $("<img>");
	img.attr('src', item.media);
	aImg.append(img);
	
	var tdContent = $("<td>");
	tdContent.addClass("content-wrapper");
	trBody.append(tdContent);
	
	var aTitle = $("<a>");
	aTitle.attr('href', item.link);
	aTitle.attr('target', "_blank");
	tdContent.append(aTitle);
	
	var title = $("<h3>");
	title.text(item.title);
	aTitle.append(title);
	
	var desc = $("<p>");
	desc.text(item.description);
	tdContent.append(desc);
	
	var trCategory = $("<tr>");
	trCategory.addClass("feed_item_category");
	tableBody.append(trCategory);
	
	var tdCategory = $("<td>");
	tdCategory.attr('colspan', '2');
	trCategory.append(tdCategory);
	
	if (isNew) {
		var divNew = $("<div>");
		divNew.addClass("new_tag");
		divNew.text("New!");
		tdCategory.append(divNew);
	}
	
	var divSource = $("<div>");
	divSource.addClass("source_tag");
	divSource.text(item.source);
	tdCategory.append(divSource);
	
	var divCategory = $("<div>");
	divCategory.addClass("category_tag");
	divCategory.css("background-color", categoryColors[item.category]);
	divCategory.text(item.category);
	tdCategory.append(divCategory);
	
	var filteredCategory = $.inArray(item.category, filters) > -1;
	
	if (filteredCategory) {
		table.hide();
	}
	
	$(".feed").prepend(table);
	
	if (!filteredCategory) {
		table.css('display', 'none');
		table.fadeIn(800);
	}
}

function addItems(items, isNew) {
	// Items will be an array of objects. Each object will represent a feed.
	// Within those objects there will be a 'updates' field which will contain
	// a list of the items for that feed (newest first).
	// This method turns that into a sequential list of items, whose children it
	// then calls addItem() on.
	
	// Remove previous "new" items
	if (isNew) {
		$(".new_tag").remove();
	}
	
	for (var itemIndex = 0; itemIndex < 5; itemIndex++) {
		
		for (var feedIndex = 0; feedIndex < items.length; feedIndex++) {
			var feed = items[feedIndex];
			if (feed.updates.length > itemIndex) {
				
				var item = feed.updates[itemIndex];
				item.category = feed.category;
				item.source = feed.source;
				
				addItem(item, isNew);
			}
		}
	}
}

function openSocket(){
    // Ensures only one connection is open at a time
    if(webSocket !== undefined && webSocket.readyState !== WebSocket.CLOSED){
        console.log("WebSocket is already opened.");
        return;
    }
    
    // IF YOU WISH TO RUN THIS SERVER LOCALLY YOU WILL HAVE TO CHANGE THIS LINE
    webSocket = new WebSocket("ws://ec2-54-229-152-220.eu-west-1.compute.amazonaws.com:8080/HotOffThePress/ws");
     
    /**
     * Binds functions to the listeners for the websocket.
     */
    webSocket.onopen = function(event){
        console.log("Connection open");
    };

    webSocket.onmessage = function(event){
        console.log("Message arrived");
    	if (loading) {
    		$(".loading-icon").hide();
    	} else {
        	$("#new_article_notify").fadeIn(600).delay(4000).fadeOut(300);
    	}
        addItems(JSON.parse(event.data), !loading);
        
        loading = false;
    };

    webSocket.onclose = function(event){
        console.log("Connection closed");
    };
}

function addFilter(category) {
	filters.push(category);
	
	$(".feed_item").each(function () {
		var c = $(this).find(".category_tag").text();
		if (category == c) {
			$(this).fadeOut(800);
		}
	});
}

function removeFilter(category) {
	// remove
	var index = filters.indexOf(category);
	if (index > -1) {
		filters.splice(index, 1);
	}
	
	$(".feed_item").each(function () {
		var c = $(this).find(".category_tag").text();
		if (category == c) {
			$(this).fadeIn(800);
		}		
	});
}

function removeAllFilters() {
	filters = [];
	
	$(".feed_item").each(function () {
		$(this).fadeIn(800);
	});
}

function addAllFilters() {
	filters = [];
	for (var col in categoryColors) {
		filters.push(col);
	}
	
	$(".feed_item").each(function () {
		$(this).fadeOut(800);
	});
}

function setupCategoryButtons() {
	$(".category_filters > div").each(function () {
		var color = categoryColors[$(this).text()];
		if (color) {
			$(this).attr('style', 'background-color:' + color);
		}
		
		$(this).click(function() {
			var categoryText = $(this).text();
			if ($.inArray(categoryText, filters) > -1) {
				
				removeFilter(categoryText);
				$(this).attr('style', 'background-color:' + categoryColors[categoryText]);
				
			} else {
				
				addFilter(categoryText);
				$(this).removeAttr('style');
				
			}
		});
	});
	
	var toggle = false; // true = displays "Select All"
	$(".all_category_selector > div").click(function() {
		
		if (toggle) { // "Select All" pressed
			$(this).removeAttr('style');
			$(".category_filters > div").each(function () {
				$(this).attr('style', 'background-color:' + categoryColors[$(this).text()]);
			});
			$(this).text("Select None");
			removeAllFilters();
			
		} else { // "Select None" pressed
			$(this).attr('style', 'background-color: #ba1818');
			$(".category_filters > div").each(function () {
				$(this).removeAttr('style');
			});
			$(this).text("Select All");
			addAllFilters();
		}
		
		toggle = !toggle;
	})
}

var categoryColors = {
		UK:              "#4682B4",
		Politics:        "#DC143C",
		Sport:           "#228B22",
		Technology:      "#4B0082",
		Entertainment:   "#FF69B4",
		World:           "#8B4513",
		Business:        "#9370DB",
		Science:         "#0000CD",
		Education:       "#4682B4",
		Health:          "#DC143C",
		Travel:          "#228B22",
		England:         "#4B0082",
		Scotland:        "#FF69B4",
		Ireland:         "#8B4513",
		Wales:           "#9370DB",
		US:              "#0000CD",
		Asia:            "#4682B4",
		Africa:          "#DC143C",
		"Middle East":   "#228B22",
		Europe:          "#4B0082",
		Americas:        "#FF69B4",
		Australia:       "#8B4513"
}




var footerExpanded = false;

function expandFooter() {
	document.getElementById("footer").style.left = "0px";
	$("#footer").find("h3").text("v Weather v");
	footerExpanded = true;
}

function shrinkFooter() {
	document.getElementById("footer").style.left = "calc(100% - 54px)";
	$("#footer").find("h3").text("^ Weather ^");
	footerExpanded = false;
}

function handleFooterClick() {
	if (footerExpanded) {
		shrinkFooter()
	} else {
		expandFooter();
	}
}