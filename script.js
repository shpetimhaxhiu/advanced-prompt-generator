function copyToClipboard() {
    const output = document.getElementById("output");
    const range = document.createRange();
    range.selectNode(output);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("copy");
    sel.removeAllRanges();

    const copyButton = document.querySelector(".output-section button:first-child");
    copyButton.textContent = "Copied!";
    setTimeout(() => {
        copyButton.textContent = "Copy to Clipboard";
    }, 2000);
}

function clearOutput() {
    document.getElementById("output").textContent = "";
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const output = document.getElementById("output");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const fieldValues = Array.from(formData.entries())
            .filter(([key, value]) => value !== "" && key !== "prompt")
            .map(([key, value]) => `${key}:'${value}'`);

        output.textContent = `${fieldValues.join("; ")};\n`;

        const prompt = formData.get("prompt");
        if (prompt !== "") {
            output.textContent += `\n\n---\nuser_prompt:'''${prompt}'''\n---\n`;
        }

        const method = formData.get("self_critique_method");
        if (method !== "none") {
            output.textContent += `\n\nAnswer: "${method}"\n\n`;
        }

        const outputSection = document.querySelector(".output-section");
        const buttons = document.querySelectorAll("button");
        outputSection.classList[output.textContent ? "add" : "remove"]("opacity-100", "cursor-auto");
        outputSection.classList[output.textContent ? "remove" : "add"]("opacity-25", "cursor-not-allowed");
        buttons.forEach((button) => button.classList[output.textContent ? "remove" : "add"]("cursor-not-allowed"));

        window.scrollTo(0, document.body.scrollHeight);
    });
});

function saveApiKey() {
    const apiKey = document.getElementById("api_key").value;
    localStorage.setItem("apg_api_key", apiKey);
    alert("API Key saved!");
}

function getApiKey() {
    // Check local storage for API key
    if (localStorage.getItem("apg_api_key")) {
        return localStorage.getItem("apg_api_key");
    } else {
        if (document.getElementById("api_key").value !== "") {
            localStorage.setItem("apg_api_key", document.getElementById("api_key").value);
        } else {
            alert("Please enter an API Key");
            return;
        }
    }
}

function getSelectedModel() {
    const modelSelect = document.getElementById("model");
    return modelSelect.options[modelSelect.selectedIndex].value;
}

function sendApiRequest() {
    const message = document.getElementById("prompt").value;
    const apiKey = getApiKey();

    if (message === "") {
        alert("Please enter a prompt");
        return;
    } else if (apiKey === "") {
        alert("Please enter an API Key");
        return;
    }

    const url = "https://api.openai.com/v1/chat/completions";
    const data = {
        model: getSelectedModel(),
        messages: [{ role: "user", content: message }],
    };

    const apiResponse = document.getElementById('api-response');

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((result) => {
            const otherInfoData = {
                model: result.model,
                prompt_tokens: result.usage.prompt_tokens,
                completion_tokens: result.usage.completion_tokens,
                total_tokens: result.usage.total_tokens
            };

            const otherInfo = document.createElement('div');
            otherInfo.classList.add('bg-gray-100', 'p-4', 'rounded-md', 'mb-4');
            otherInfo.innerHTML = `<h2 class="text-xl font-bold mb-4">Other Info</h2>
        <div class="flex flex-col space-y-2">
          <div><span class="font-bold">Model:</span> ${otherInfoData.model}</div>
          <div><spanclass="font-bold">Prompt Tokens:</span> ${otherInfoData.prompt_tokens}</div>
          <div><span class="font-bold">Completion Tokens:</span> ${otherInfoData.completion_tokens}</div>
          <div><span class="font-bold">Total Tokens:</span> ${otherInfoData.total_tokens}</div>
        </div>`;

            console.log("Success:", result);
            console.log(result);

            const messageContent = result.choices[0]?.message?.content;
            const messageContentWithBreaks = messageContent.replace(/\n/g, "<br>");
            apiResponse.innerHTML = messageContentWithBreaks;
            apiResponse.parentNode.appendChild(otherInfo);
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

document.getElementById("try-prompt").addEventListener("click", sendApiRequest);
