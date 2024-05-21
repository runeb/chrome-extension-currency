// Function to format number with commas as thousand separators
function formatNumberWithCommas(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Function to convert dollar amounts to NOK
function convertDollarsToNOK(node, conversionRate) {
  const dollarAmountRegex = /\$\d{1,3}(,\d{3})*(\.\d{2})?/g;

  function getTextNodes(node) {
    const textNodes = [];
    function recursiveSearch(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() !== "script" && node.tagName.toLowerCase() !== "style") {
        for (let child of node.childNodes) {
          recursiveSearch(child);
        }
      }
    }
    recursiveSearch(node);
    return textNodes;
  }

  const textNodes = getTextNodes(node);

  textNodes.forEach(node => {
    const matches = node.textContent.match(dollarAmountRegex);
    if (matches) {
      matches.forEach(match => {
        const dollarAmount = parseFloat(match.replace(/[$,]/g, ''));
        const nokAmount = (dollarAmount * conversionRate).toFixed(2);
        const formattedNokAmount = formatNumberWithCommas(nokAmount);
        node.textContent = node.textContent.replace(match, `${formattedNokAmount} NOK`);
      });
    }
  });
}

function initializeConversion() {
  chrome.storage.sync.get(['conversionEnabled', 'exchangeRate'], (data) => {
    if (data.conversionEnabled && data.exchangeRate) {
      convertDollarsToNOK(document.body, data.exchangeRate);

      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              convertDollarsToNOK(node, data.exchangeRate);
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleConversion') {
    if (request.state) {
      initializeConversion();
    } else {
      location.reload(); // Reload the page to remove conversions
    }
  }
});

initializeConversion();
