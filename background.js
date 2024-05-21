async function fetchExchangeRate() {
  const url = 'https://data.norges-bank.no/api/data/EXR/B.USD.NOK.SP?format=sdmx-json&lastNObservations=1&locale=en';
  try {
    const response = await fetch(url);
    const data = await response.json();
    const series = data.data.dataSets[0].series["0:0:0:0"];
    const rate = series.observations["0"][0];
    return parseFloat(rate);
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: "toggleConversion",
    title: "Toggle Dollar to NOK Conversion",
    contexts: ["all"]
  });

  const rate = await fetchExchangeRate();
  if (rate) {
    chrome.storage.sync.set({ conversionEnabled: true, exchangeRate: rate });
  } else {
    chrome.storage.sync.set({ conversionEnabled: true });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "toggleConversion") {
    chrome.storage.sync.get('conversionEnabled', async (data) => {
      const newState = !data.conversionEnabled;
      if (newState) {
        const rate = await fetchExchangeRate();
        if (rate) {
          chrome.storage.sync.set({ conversionEnabled: newState, exchangeRate: rate }, () => {
            chrome.tabs.sendMessage(tab.id, { action: 'toggleConversion', state: newState });
            chrome.notifications.create('', {
              title: 'Dollar to NOK Converter',
              message: 'Conversion enabled',
              iconUrl: 'icons/icon48.png',
              type: 'basic'
            });
          });
        } else {
          chrome.notifications.create('', {
            title: 'Dollar to NOK Converter',
            message: 'Failed to fetch exchange rate',
            iconUrl: 'icons/icon48.png',
            type: 'basic'
          });
        }
      } else {
        chrome.storage.sync.set({ conversionEnabled: newState }, () => {
          chrome.tabs.sendMessage(tab.id, { action: 'toggleConversion', state: newState });
          chrome.notifications.create('', {
            title: 'Dollar to NOK Converter',
            message: 'Conversion disabled',
            iconUrl: 'icons/icon48.png',
            type: 'basic'
          });
        });
      }
    });
  }
});
