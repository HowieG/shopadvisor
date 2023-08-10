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

		// Fetch new suggestions and replace HTML
		alternativesText.innerHTML = "";

		const newAlternativesHTML = await gpt(
			suggestAlternativesPrompt(
				productType,
				productUrl,
				newProductConsiderations
			)
		);

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
		const productCategoryInquiry = await gpt(
			inquireAboutProductCategoryPrompt(request.productUrl),
			gpt3turbo4k,
			2000
		);

		const productType = parseProductType(productCategoryInquiry);
		const productConsiderations = parseConsiderations(
			productCategoryInquiry
		);
		const productScores = await gpt(
			inquireAboutThisProductPrompt(
				productType,
				request.productUrl,
				productConsiderations.slice(0, 10)
			)
		);

		const alternatives = await gpt(
			suggestAlternativesPrompt(
				productType,
				request.productUrl,
				productConsiderations.slice(0, 10)
			),
			gpt3turbo16k
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

async function gpt(
	prompt,
	model = gpt3turbo4k,
	maxTokensOverride = null,
	temperatureOverride = null
) {
	console.log(prompt);

	const baseUrl = "https://api.openai.com/v1";
	const response = await fetch(`${baseUrl}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${OpenAIKey}`,
		},
		body: JSON.stringify({
			model: model.model,
			messages: [
				{
					role: "system",
					content:
						"You are ShopAdvisor, a shopping assistant helping consumers discover and narrow \
						down exactly what products they are searching for",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: maxTokensOverride
				? maxTokensOverride
				: model.max_tokens - prompt.length,
			temperature: temperatureOverride ? temperatureOverride : 0.7, // TODO: Play with this
		}),
	});

	const data = await response.json();
	const res = data.choices[0].message.content;

	return res;
}

const gpt3turbo4k = {
	model: "gpt-3.5-turbo-16k",
	max_tokens: 4000,
};

const gpt3turbo16k = {
	model: "gpt-3.5-turbo-16k",
	max_tokens: 16000,
};

function considerationDetailsPrompt(productType, consideration) {
	return (
		"As it pertains to " +
		productType +
		", what is the importance of" +
		consideration +
		". If " +
		consideration +
		"is not something the average consumer would be expected to know about, \
		 please give a consumer-level explanation of the concept first."
	);
}

function suggestAlternativesPrompt(
	productType,
	productConsiderations,
	productUrl
) {
	return (
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
		Return all of that in HTML table format using table, tr, th, td. The table should have 5 rows, one for each suggested alternative.  \
		Product name should be links. Let's think step by step. It is very imporant that only HTML is returned"
	);
}

function inquireAboutThisProductPrompt(
	productType,
	productConsiderations,
	productUrl
) {
	return (
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
		Return this as an HTML table format using table, tr, th, td. \
		Let's think step by step. It is very imporant that only HTML is returned"
	);
}

function inquireAboutProductCategoryPrompt(productUrl) {
	return (
		"what type of product is this? \
		what are some important things a consumer should consider when buying this type of product? \
		be very exhaustive, come up with considerations the average person might not think about. \
		Do not reply with a paragraph. Reply in exactly this format: \
		ProductType: [product type] \
		Considerations: [considerations as pipe-separated list]" + productUrl
	);
}

/*

top_p
number or null
Optional
Defaults to 1
An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.

We generally recommend altering this or temperature but not both.

presence_penalty
number or null
Optional
Defaults to 0
Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.

frequency_penalty
number or null
Optional
Defaults to 0
Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.


logit_bias
map
Optional
Defaults to null
Modify the likelihood of specified tokens appearing in the completion.

Accepts a json object that maps tokens (specified by their token ID in the tokenizer) to an associated bias value from -100 to 100. Mathematically, the bias is added to the logits generated by the model prior to sampling. The exact effect will vary per model, but values between -1 and 1 should decrease or increase likelihood of selection; values like -100 or 100 should result in a ban or exclusive selection of the relevant token.





*/
