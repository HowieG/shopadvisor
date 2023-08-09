// Link external CSS
const globalCssLink = document.createElement("link");
globalCssLink.rel = "stylesheet";
globalCssLink.type = "text/css";
globalCssLink.href = "http://localhost:8000/src/css/global.css";
document.head.appendChild(globalCssLink);

const modalCssLink = document.createElement("link");
modalCssLink.rel = "stylesheet";
modalCssLink.type = "text/css";
modalCssLink.href = "http://localhost:8000/src/css/modal.css";
document.head.appendChild(modalCssLink);

function createModalView(imageUrl, productType, productConsiderations) {
	const modal = document.createElement("div");
	modal.classList.add("tailor-modal");
	const modalContent = document.createElement("div");
	modalContent.classList.add("tailor-modal-content");

	// Close modal button
	const modalClose = document.createElement("span");
	modalClose.classList.add("tailor-modal-close");
	modalClose.textContent = "\u00D7";
	modalContent.appendChild(modalClose);

	// When the user clicks anywhere outside of the modal, close it
	// window.addEventListener("click", function (event) {
	// 	if (event.target != modal) {
	// 		modal.style.display = "none";
	// 	}
	// });

	const sourceImageContainer = document.createElement("div");
	sourceImageContainer.id = "source-image-container";
	const sourceImg = document.createElement("img");
	sourceImg.id = "source-img";
	sourceImg.src = imageUrl;
	sourceImageContainer.appendChild(sourceImg);
	modalContent.appendChild(sourceImageContainer);

	const tailorSelectionContainer = document.createElement("div");
	tailorSelectionContainer.id = "tailor-selection-container";

	const tailorTitle = document.createElement("h1");
	tailorTitle.id = "tailor-title";
	var tailorColoredHTML =
		"t<span style='color: var(--tailor-green);'>ai</span>lor";
	tailorTitle.innerHTML = tailorColoredHTML;
	tailorSelectionContainer.appendChild(tailorTitle);

	const explanatoryTextContainer = document.createElement("div");
	const explanatoryText1 = document.createElement("p");
	explanatoryText1.classList.add("explanatory-text-container");
	explanatoryText1.innerHTML =
		"When purchasing a " +
		productType +
		", it's important to consider the following. \
		Please select the features you care about.";
	explanatoryTextContainer.appendChild(explanatoryText1);
	tailorSelectionContainer.appendChild(explanatoryTextContainer);

	const buttonContainer = document.createElement("div");
	buttonContainer.id = "button-container";
	tailorSelectionContainer.appendChild(buttonContainer);

	const textarea = document.createElement("textarea");
	textarea.id = "tailor-input-text-area";
	textarea.placeholder =
		"Enter anything else you'd like to see in your final product";
	tailorSelectionContainer.appendChild(textarea);

	const tailorButton = document.createElement("button");
	tailorButton.id = "tailor-button";
	tailorButton.textContent = "tailor";
	tailorSelectionContainer.appendChild(tailorButton);

	// When the user clicks the close button, delete the modal
	modalClose.addEventListener("click", function () {
		modal.remove();
	});

	modalContent.appendChild(tailorSelectionContainer);
	modal.appendChild(modalContent);
	document.body.appendChild(modal);

	buttonContainer.innerHTML = "";
	productConsiderations.forEach((token) => {
		const button = document.createElement("button");
		button.textContent = token;
		button.style.fontSize = "10px";
		button.classList.add("btn");
		button.addEventListener("click", () => {
			button.classList.remove("dislike");
			button.classList.toggle("like");
		});
		button.addEventListener("dblclick", () => {
			button.classList.remove("like");
			button.classList.add("dislike");
		});
		buttonContainer.appendChild(button);
	});
}

chrome.runtime.onMessage.addListener(async function (request) {
	if (request.action === "openModalView") {
		const productCategoryInquiry = await inquireAboutProductCategory(
			request.productUrl
		);

		// const descriptionArray = await callImg2Txt(request.imageUrl);
		// let distilledDescriptionArray = await distillDescription(
		// 	descriptionArray
		// );

		const productType = parseProductType(productCategoryInquiry);
		const productConsiderations = parseConsiderations(
			productCategoryInquiry
		);
		createModalView(request.imageUrl, productType, productConsiderations);
	}
});

async function inquireAboutProductCategory(productUrl) {
	const baseUrl = "https://api.openai.com/v1";
	const OpenAIToken = "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";
	const prompt =
		"what type of product is this? \
		what are some important things a consumer should consider when buying this type of product? \
		be very exhaustive, come up with considerations the average person might not think about. \
		Do not reply with a paragraph. Reply in exactly this format: \
		ProductType: [product type] \
		Considerations: [considerations as an enumerated list]" + productUrl;
	const response = await fetch(`${baseUrl}/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${OpenAIToken}`,
		},
		body: JSON.stringify({
			model: "text-davinci-003",
			prompt: prompt,
			max_tokens: 500,
			temperature: 0.7,
		}),
	});

	const data = await response.json();
	const productConsiderations = data.choices[0].text;

	return productConsiderations;
}

function parseProductType(productConsiderations) {
	const productTypeMatch = productConsiderations.match(
		/ProductType: ([^\n]*)/
	);
	const productType = productTypeMatch ? productTypeMatch[1] : "Unknown";
	return productType;
}

function parseConsiderations(productConsiderations) {
	const considerations = [];
	const considerationsMatch = productConsiderations.match(/\d+\..+/g);

	if (considerationsMatch) {
		considerationsMatch.forEach((consideration) => {
			considerations.push(consideration);
		});
	}

	return considerations;
}

// const TheNextLegToken = "bc9150d1-ec69-40f2-a5f8-3b16a0ef3712";

// async function callImg2Txt(imageUrl) {
// 	const url = "https://api.thenextleg.io/v2/describe";
// 	const body = {
// 		url: imageUrl,
// 	};

// 	try {
// 		const response = await fetch(url, {
// 			method: "POST",
// 			headers: {
// 				"Content-Type": "application/json",
// 				Authorization: `Bearer ${TheNextLegToken}`,
// 			},
// 			body: JSON.stringify(body),
// 		});

// 		const data = await response.json();
// 		const messageId = data.messageId;
// 		return await getMessage(messageId);
// 	} catch (error) {
// 		console.error("Error:", error);
// 	}
// }

// async function getMessage(messageId) {
// 	const url = `https://api.thenextleg.io/v2/message/${messageId}`;

// 	try {
// 		let data;
// 		do {
// 			const response = await fetch(url, {
// 				method: "GET",
// 				headers: {
// 					"Content-Type": "application/json",
// 					Authorization: `Bearer ${TheNextLegToken}`,
// 				},
// 			});

// 			data = await response.json();
// 			if (data.progress !== 100) {
// 				await new Promise((r) => setTimeout(r, 100));
// 			}
// 		} while (data.progress !== 100); // temporary hack until I set up a webhook

// 		return data.response.content;
// 	} catch (error) {
// 		console.error("Error:", error);
// 	}
// }

// async function distillDescription(descriptionArray) {
// 	const baseUrl = "https://api.openai.com/v1";
// 	const OpenAIToken = "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";
// 	const superDescription = descriptionArray.join(" ");
// 	const prompt =
// 		"I am writing a bulleted product description of the product described above. distill the description into the essential/unique words or phrases that describe its visual form, style, materials, design. separate every word or phrase by comma. no names of people";

// 	const response = await fetch(`${baseUrl}/completions`, {
// 		method: "POST",
// 		headers: {
// 			"Content-Type": "application/json",
// 			Authorization: `Bearer ${OpenAIToken}`,
// 		},
// 		body: JSON.stringify({
// 			model: "text-davinci-003",
// 			prompt: `${superDescription} ${prompt}`,
// 			max_tokens: 250,
// 			temperature: 0.7,
// 		}),
// 	});

// 	const data = await response.json();
// 	const rawDescription = data.choices[0].text;
// 	const distilledDescriptionArray = rawDescription
// 		.replace(/\n/g, "")
// 		.replace(/\.$/, "")
// 		.split(", ");

// 	return distilledDescriptionArray;
// }
