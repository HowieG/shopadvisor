chrome.runtime.onInstalled.addListener(function () {
	if (chrome.contextMenus) {
		chrome.contextMenus.create({
			id: "tailorContextMenu",
			title: "TaiLOR",
			contexts: ["link", "image"],
			// icons: {
			// 	16: "../../assets/favicon-16x16.png",
			// 	32: "../../assets/favicon-32x32.png",
			// }
		});
	}
});

// TODO: Needs to work for both link and image contexts.
// If image context, need to send to a multimodal model to infer product type
chrome.contextMenus.onClicked.addListener(function (info, tab) {
	if (info.menuItemId === "tailorContextMenu") {
		console.log(info);
		chrome.tabs.sendMessage(tab.id, {
			action: "openModalView",
			productUrl: info.linkUrl,
			imageUrl: info.srcUrl,
		});
	}
});
