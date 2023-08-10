const LONG_PRESS_DURATION = 1500;

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

	// When the user clicks anywhere outside of the modal, close it
	// window.addEventListener("click", function (event) {
	// 	if (event.target != modal) {
	// 		modal.style.display = "none";
	// 	}
	// });

	const sourceProductContainer = document.createElement("div");
	sourceProductContainer.id = "source-product-container";

	const shopAdvisorTitle = document.createElement("h1");
	shopAdvisorTitle.id = "tailor-title";
	shopAdvisorTitle.innerText = "ShopAdvisor";
	sourceProductContainer.appendChild(shopAdvisorTitle);

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

	const explanatoryTextContainer = document.createElement("div");
	explanatoryTextContainer.classList.add("explanatory-text-container"); // TODO
	const explanatoryText1 = document.createElement("p");
	explanatoryText1.innerHTML =
		"When purchasing a " +
		productType +
		", it's important to consider the following.<br>" +
		"Select the features you care about to help guide your search.<br>" +
		"Hold down on a feature to learn more about it.";
	explanatoryTextContainer.appendChild(explanatoryText1);
	tailorSelectionContainer.appendChild(explanatoryTextContainer);

	const buttonContainer = document.createElement("div");
	buttonContainer.id = "button-container";
	tailorSelectionContainer.appendChild(buttonContainer);

	modalContent.appendChild(tailorSelectionContainer);
	modal.appendChild(modalContent);
	document.body.appendChild(modal);

	productConsiderations.forEach((token) => {
		let timer;

		const buttonWrapper = document.createElement("div");
		buttonWrapper.style.position = "relative";
		buttonWrapper.style.display = "inline-block";
		buttonWrapper.classList.add("btn-wrapper");

		const button = document.createElement("button");
		button.textContent = token;
		button.style.fontSize = "10px";
		button.classList.add("btn");

		let isLongPress = false; // A variable to track the state of the long press

		button.addEventListener("mousedown", () => {
			timer = setTimeout(() => {
				isLongPress = true; // Set the state to true if the button is pressed for 1500ms

				const considerationDetails = document.getElementById(
					"consideration-details"
				);

				considerationDetails.innerHTML =
					"Loading helpful info about this attribute...";

				considerationDetails.style.display = "block";

				// Fetch the consideration details asynchronously
				gpt(getConsiderationDetailsPrompt(productType, token)).then(
					(details) => {
						considerationDetails.innerHTML = details;
					}
				);
			}, LONG_PRESS_DURATION);
		});

		// Add a mouse up listener to clear the timer if the button is released
		button.addEventListener("mouseup", () => {
			clearTimeout(timer);
			if (!isLongPress) {
				button.classList.remove("dislike");
				button.classList.toggle("like");
			}
			isLongPress = false; // Reset the state
		});

		// Add a mouse leave listener to clear the timer if the mouse leaves the button
		button.addEventListener("mouseleave", () => {
			clearTimeout(timer);
			isLongPress = false; // Reset the state
		});

		buttonWrapper.appendChild(button);
		buttonContainer.appendChild(buttonWrapper);
	});

	const considerationDetailsContainer = document.createElement("div");
	considerationDetailsContainer.id = "consideration-details";
	considerationDetailsContainer.innerHTML =
		"Loading helpful info about this attribute...";
	considerationDetailsContainer.style.height = "auto";
	considerationDetailsContainer.style.width = "auto";
	considerationDetailsContainer.style.display = "none";
	tailorSelectionContainer.appendChild(considerationDetailsContainer);

	const inputContainer = document.createElement("div");
	inputContainer.id = "tailor-input-container";

	const textarea = document.createElement("textarea");
	textarea.id = "tailor-input-text-area";
	textarea.placeholder = "Enter anything else to tailor your search";
	inputContainer.appendChild(textarea);

	const tailorButton = document.createElement("button");
	tailorButton.id = "tailor-button";
	tailorButton.textContent = "Search";
	inputContainer.appendChild(tailorButton);

	tailorSelectionContainer.appendChild(inputContainer);

	tailorButton.addEventListener("click", async () => {
		// Collect all buttons with classlist "like" and form the new productConsiderations
		const likedButtons = document.querySelectorAll(".btn.like");
		const newProductConsiderations = Array.from(likedButtons)
			.map((button) => button.textContent)
			.join("|");

		// Fetch new suggestions and replace HTML
		alternativesText.innerHTML = "";

		const newAlternativesHTML = await gpt(
			getAlternativeSuggestionsPrompt(
				productType,
				newProductConsiderations,
				productUrl
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

	// Close modal button
	const modalClose = document.createElement("span");
	modalClose.classList.add("tailor-modal-close");
	modalClose.textContent = "\u00D7";
	modalContent.appendChild(modalClose);

	modalClose.addEventListener("click", function () {
		modal.remove();
	});
}

chrome.runtime.onMessage.addListener(async function (request) {
	if (request.action === "openModalView") {
		const productType = await gpt(
			getProductTypePrompt(request.productUrl),
			gpt3turbo4k,
			10,
			0
		);

		let productConsiderations = await gpt(
			getConsiderationsPrompt(productType),
			gpt3turbo4k,
			100
		);

		// For now, convert pipe-separated list to array
		productConsiderations = productConsiderations.split("|");

		// Fetch productScores and alternatives at the same time
		const [productScores, alternatives] = await Promise.all([
			gpt(
				getProductReviewPrompt(
					productType,
					productConsiderations.slice(0, 10),
					request.productUrl
				)
			),
			gpt(
				getAlternativeSuggestionsPrompt(
					productType,
					productConsiderations.slice(0, 10),
					request.productUrl
				),
				gpt3turbo16k
			),
		]);

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

function getConsiderationDetailsPrompt(productType, consideration) {
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

function getAlternativeSuggestionsPrompt(
	productType,
	productConsiderations,
	productUrl
) {
	return (
		"I'm looking to buy a " +
		productType +
		". I have the following considerations: " +
		productConsiderations +
		". I'm currently viewing this product: " +
		productUrl +
		". Recommend me 5 alternative products. Score the alternatives from 1 to 10 according to these considerations and give a \
		detailed explanation of how the alternative satisfies or doesn't satisfy each consideration. \
		Return each as an HTML table format using table, tr, th, td. The product name should link to the recommended product\
		Let's think step by step. It is very imporant that HTML is returned"
	);
}

function getProductReviewPrompt(
	productType,
	productConsiderations,
	productUrl
) {
	return (
		"I'm looking to buy a " +
		productType +
		". I have the following considerations: " +
		productConsiderations +
		". I'm currently viewing this product: " +
		productUrl +
		". Score this item from 1 to 10 according to these considerations and give a detailed explanation of how this product \
		satisfies or doesn't satisfy each consideration. For each consideration compare it to other products that excel at them. \
		Return this as an HTML table format using table, tr, th, td. \
		Let's think step by step. It is very imporant that only HTML is returned"
	);
}

function getProductTypePrompt(productUrl) {
	return (
		"what type of product is this? " +
		productUrl +
		". Reply with just the product type"
	);
}

function getConsiderationsPrompt(productType) {
	return (
		"what are some important things a consumer should consider when buying a " +
		productType +
		"? come up with considerations the average person might not think about.\
		Be exhaustive but not repetetive. Unique insights i.e. features that are unique to this product type \
		e.g. not warranty, design, etc. Think outside of the box. \
		Reply with just a pipe-separated list"
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
