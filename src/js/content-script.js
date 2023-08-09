const OpenAIModel = "text-davinci-003"; // TODO: Update to gpt-4

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

function createModalView(
	productUrl,
	imageUrl,
	productType,
	productConsiderations,
	productScores,
	alternatives
) {
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

	const sourceProductContainer = document.createElement("div");
	sourceProductContainer.id = "source-product-container";
	const sourceImg = document.createElement("img");
	sourceImg.id = "source-img";
	sourceImg.src = imageUrl;
	sourceProductContainer.appendChild(sourceImg);

	const productScoresContainer = document.createElement("div");
	productScoresContainer.id = "product-score-container"; // TODO
	const reviewLabel = document.createElement("h2");
	reviewLabel.innerText = "Product Review Summary";
	const productScoresText = document.createElement("div");
	productScoresText.innerHTML = productScores;
	productScoresContainer.appendChild(reviewLabel);
	productScoresContainer.appendChild(productScoresText);
	sourceProductContainer.appendChild(productScoresContainer);

	modalContent.appendChild(sourceProductContainer);

	const tailorSelectionContainer = document.createElement("div");
	tailorSelectionContainer.id = "tailor-selection-container";

	const tailorTitle = document.createElement("h1");
	tailorTitle.id = "tailor-title";
	var tailorColoredHTML =
		"t<span style='color: var(--tailor-green);'>ai</span>lor";
	tailorTitle.innerHTML = tailorColoredHTML;
	tailorSelectionContainer.appendChild(tailorTitle);

	const explanatoryTextContainer = document.createElement("div");
	explanatoryTextContainer.classList.add("explanatory-text-container"); // TODO
	const explanatoryText1 = document.createElement("p");
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

	// When the user clicks the close button, delete the modal
	modalClose.addEventListener("click", function () {
		modal.remove();
	});

	modalContent.appendChild(tailorSelectionContainer);
	modal.appendChild(modalContent);
	document.body.appendChild(modal);

	productConsiderations.forEach((token) => {
		const buttonWrapper = document.createElement("div");
		buttonWrapper.style.position = "relative";
		buttonWrapper.style.display = "inline-block";
		buttonWrapper.classList.add("btn-wrapper");

		const button = document.createElement("button");
		button.textContent = token;
		button.style.fontSize = "10px";
		button.classList.add("btn");
		button.addEventListener("click", () => {
			button.classList.remove("dislike");
			button.classList.toggle("like");
		});
		buttonWrapper.appendChild(button);

		// const questionMark = document.createElement("span");
		// questionMark.textContent = "\u24E8"; // Unicode for circled question mark
		// questionMark.style.position = "absolute";
		// questionMark.style.top = "0";
		// questionMark.style.right = "0";
		// questionMark.style.cursor = "pointer";
		// questionMark.addEventListener("click", () => {
		// 	// Call a function or perform the action you want here
		// 	getMoreInfoAboutConsideration(productType, token); // TODO
		// });
		// buttonWrapper.appendChild(questionMark);

		buttonContainer.appendChild(buttonWrapper);
	});

	const textarea = document.createElement("textarea");
	textarea.id = "tailor-input-text-area";
	textarea.placeholder =
		"Enter anything else you'd like to see in your final product";
	tailorSelectionContainer.appendChild(textarea);

	const tailorButton = document.createElement("button");
	tailorButton.id = "tailor-button";
	tailorButton.textContent = "tailor";
	tailorSelectionContainer.appendChild(tailorButton);

	tailorButton.addEventListener("click", async () => {
		// Collect all buttons with classlist "like" and form the new productConsiderations
		const likedButtons = document.querySelectorAll(".btn.like");
		const newProductConsiderations = Array.from(likedButtons)
			.map((button) => button.textContent)
			.join("|");

		// Remove alternativesText.innerHTML
		alternativesText.innerHTML = "";

		// Call fetchAlternatives with new considerations
		const newAlternativesHTML = await fetchAlternatives(
			productType,
			productUrl, // Assuming you have access to this, or you'll need to define it
			newProductConsiderations
		);

		// Replace alternativesText.innerHTML with the new HTML
		alternativesText.innerHTML = newAlternativesHTML;
	});

	const alternativesContainer = document.createElement("div");
	alternativesContainer.id = "product-score-container"; // TODO
	const alternativesLabel = document.createElement("h2");
	alternativesLabel.innerText = "Suggested Alternatives";
	const alternativesText = document.createElement("div");
	alternativesText.innerHTML = alternatives;
	alternativesContainer.appendChild(alternativesLabel);
	alternativesContainer.appendChild(alternativesText);
	tailorSelectionContainer.appendChild(alternativesContainer);
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
		const productScores = await inquireAboutThisProduct(
			productType,
			request.productUrl,
			productConsiderations
		);

		const alternatives = await fetchAlternatives(
			productType,
			request.productUrl,
			productConsiderations
		);

		createModalView(
			request.productUrl,
			request.imageUrl,
			productType,
			productConsiderations,
			productScores,
			alternatives
		);
	}
});

async function inquireAboutProductCategory(productUrl) {
	const baseUrl = "https://api.openai.com/v1";
	const prompt =
		"what type of product is this? \
		what are some important things a consumer should consider when buying this type of product? \
		be very exhaustive, come up with considerations the average person might not think about. \
		Do not reply with a paragraph. Reply in exactly this format: \
		ProductType: [product type] \
		Considerations: [considerations as pipe-separated list]" + productUrl;
	const response = await fetch(`${baseUrl}/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${OpenAIKey}`,
		},
		body: JSON.stringify({
			model: OpenAIModel,
			prompt: prompt,
			max_tokens: 4000 - prompt.length, // Max is 4097 for this model, including prompt length. Using this to be safe
			temperature: 0.7, // TODO: Play with this
		}),
	});

	const data = await response.json();
	const productConsiderations = data.choices[0].text;

	return productConsiderations;
}

async function inquireAboutThisProduct(
	productType,
	productUrl,
	productConsiderations
) {
	const baseUrl = "https://api.openai.com/v1";
	const prompt =
		"I'm looking to buy a " +
		productType +
		"I have the following considerations: " +
		productConsiderations +
		". I'm currently viewing this product: " +
		productUrl +
		". I'm not tied to exactly this product, I just want to get the most value for my dollar, \
		in the same price range as this item or cheaper if there's no significant drop in quality or my considerations. \
		Score this item from 1 to 10 according to these considerations and give a detailed explanation of how this product \
		satisfies or doesn't satisfy each consideration. \
		Return this as an HTML table.";
	const response = await fetch(`${baseUrl}/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${OpenAIKey}`,
		},
		body: JSON.stringify({
			model: OpenAIModel,
			prompt: prompt,
			max_tokens: 4000 - prompt.length, // Max is 4097 for this model, including prompt length. Using this to be safe
			temperature: 0.7, // TODO: Play with this
		}),
	});

	const data = await response.json();
	const productScores = data.choices[0].text;

	return productScores;
}

async function fetchAlternatives(
	productType,
	productUrl,
	productConsiderations
) {
	const baseUrl = "https://api.openai.com/v1";
	const prompt =
		"I'm looking to buy a " +
		productType +
		"I have the following considerations: " +
		productConsiderations +
		". I'm currently viewing this product: " +
		productUrl +
		". I'm not tied to exactly this product, I just want to get the most value for my dollar, \
		in the same price range as this item or cheaper if there's no significant drop in quality or my considerations. \
		Suggest 5 alternatives that score best on these considerations. Give me the score and a detailed explanation \
		of how this alternative satisfies this consideration. \
		Return this as an HTML table. The table should have 5 rows, one for each suggested alternative  \
		Product name should be anchors.";
	const response = await fetch(`${baseUrl}/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${OpenAIKey}`,
		},
		body: JSON.stringify({
			model: OpenAIModel,
			prompt: prompt,
			max_tokens: 4000 - prompt.length, // Max is 4097 for this model, including prompt length. Using this to be safe
			temperature: 0.7, // TODO: Play with this
		}),
	});

	const data = await response.json();
	const productScores = data.choices[0].text;

	return productScores;
}

async function getMoreInfoAboutConsideration(productType, consideration) {
	const baseUrl = "https://api.openai.com/v1";
	const prompt =
		"As it pertains to " +
		productType +
		", what is the importance of" +
		consideration +
		". If " +
		consideration +
		"is not something the average consumer would be expected to know about, \
		 please give a consumer-level explanation of the concept first.";
	const response = await fetch(`${baseUrl}/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${OpenAIKey}`,
		},
		body: JSON.stringify({
			model: OpenAIModel,
			prompt: prompt,
			max_tokens: 4000 - prompt.length, // Max is 4097 for this model, including prompt length. Using this to be safe
			temperature: 0.7, // TODO: Play with this
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
	// Extract everything after "Considerations: "
	const startIndex =
		productConsiderations.indexOf("Considerations:") +
		"Considerations: ".length;
	const considerationsString = productConsiderations.substring(startIndex);

	// Split the string by commas and trim any leading or trailing whitespace from each item
	const considerations = considerationsString.split("|").map((item) => {
		const trimmedItem = item.trim();
		return trimmedItem.charAt(0).toUpperCase() + trimmedItem.slice(1);
	});

	return considerations;
}

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
// 	const OpenAIToken = "";
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
