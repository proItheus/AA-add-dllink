// ==UserScript==
// @name         Add External Download Links to Anna's Archive
// @version      0.4
// @description  Add download links from external sources (libgen li, libgen rs, zlib) to Anna's Archive search results
// @author       proItheus
// @match        https://annas-archive.org/search?q=*
// @grant        GM_xmlhttpRequest
// @license      GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// @updateURL    https://raw.githubusercontent.com/proItheus/AA-add-dllink/master/aa-add-dllink.user.js
// @connect      annas-archive.org
// ==/UserScript==

(function () {
  'use strict';

  const downloadLinkLabels = {
    libgen: 'Libgen',
    libgenRs: 'Libgen RS',
    zlib: 'Zlib'
  };

  // Extracts download links from the individual item page
  async function getDownloadLinks(itemPageURL) {
    const response = await fetch(itemPageURL);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    const links = Array.from(doc.querySelectorAll('.js-show-external.list-inside .js-download-link'));

    return {
      libgen: links.find(a => a.text.match(/Libgen\.li/))?.href || null,
      libgenRs: links.find(a => a.text.match(/Libgen\.rs/))?.href || null,
      zlib: links.find(a => a.text.match(/Z-Library/))?.href || null
    };
  }

  // Checks if an item is hidden
  function isItemHidden(item) {
    return item.classList.contains('js-scroll-hidden');
  }

  // Creates a list item for each available download link
  function createDownloadLink(listSection, label, url) {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.href = url;
    link.textContent = label;
    listItem.appendChild(link);
    listSection.appendChild(listItem);
  }

  // Adds download links to the item
  async function processItem(item) {
    if (item.classList.contains('processed')) return;

    item.classList.add('processed');
    const itemPageURL = item.querySelector('a').href;
    const innerItem = item.querySelector('a');

    const links = await getDownloadLinks(itemPageURL);
    let downloadSection = item.querySelector('.download-links');

    if (!downloadSection) {
      downloadSection = document.createElement('ul');
      downloadSection.classList.add('download-links');
      innerItem.appendChild(downloadSection);
    }

    // Add download links to the section if they exist
    for (const [key, label] of Object.entries(downloadLinkLabels)) {
      if (links[key]) {
        createDownloadLink(downloadSection, label, links[key]);
      }
    }
  }

  // Initialize the script
  window.addEventListener('load', () => {
    // Process items on page load
    document.querySelectorAll('#aarecord-list > div').forEach(item => {
      if (isItemHidden(item)) {
        new MutationObserver((mutationsList, observer) => {
          for (const mutation of mutationsList) {
            if (!isItemHidden(mutation.target)) {
              observer.disconnect();
              processItem(mutation.target);
              break;
            }
          }
        }).observe(item, { attributeFilter: ['class'] });
      } else {
        processItem(item);
      }
    });
  });
})();
