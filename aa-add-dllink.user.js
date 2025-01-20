// ==UserScript==
// @name         Add External Download Links to Anna's Archive
// @version      0.3
// @description  Add download links from external sources (libgen, libgen rs, zlib) to Anna's Archive search results
// @author       proItheus
// @match        https://annas-archive.org/search?q=*
// @grant        GM_xmlhttpRequest
// @connect      annas-archive.org
// ==/UserScript==

(function () {
  'use strict';

  // Function to extract download links from the individual item page
  async function getDownloadLinks(itemPageURL) {
    const response = await fetch(itemPageURL);
    const html = await response.text();

    var parser = new DOMParser();
    var doc = parser.parseFromString(html, "text/html");
    const links = Array.from(doc.querySelectorAll('.js-show-external.list-inside .js-download-link'));

    const libgenLink = links.find(a => a.text.match(/Libgen\.li/))?.href;
    const libgenRsLink = links.find(a => a.text.match(/Libgen\.rs/))?.href;
    const zlibLink = links.find(a => a.text.match(/Z-Library/))?.href;

    return {
      libgen: libgenLink || null,
      libgenRs: libgenRsLink || null,
      zlib: zlibLink || null
    };
  }

  function ishidden(node) {
    return node.classList.contains('js-scroll-hidden')
  }

  // Function to add download links to a specific item
  function processItem(item) {
    if (item.classList.contains('processed')) {
      return; // Skip already processed items
    }
    item.classList.add('processed'); // Mark the item as processed

    const itemPageURL = item.querySelector('a').href; // Get the URL to the item's individual page
    const innerItem = item.querySelector('a');

    getDownloadLinks(itemPageURL).then(links => {
      let downloadSection = item.querySelector('.download-links'); // Create a section for the links

      if (!downloadSection) {
        downloadSection = document.createElement('ul');
        downloadSection.style.listStyleType = 'disc'; // Adds dots before list items
        downloadSection.style.paddingLeft = '20px';  // Adds space before the list
        downloadSection.classList.add('download-links');
        innerItem.appendChild(downloadSection);
      }

      // Prevent line-wrapping and allow text to be visible
      downloadSection.style.whiteSpace = 'normal';  // Allow wrapping within the links
      downloadSection.style.wordWrap = 'break-word'; // Break long words when necessary
      downloadSection.style.wordBreak = 'break-all'; // Allow breaks in long words
      downloadSection.style.display = 'flex'; // Make the section flexible
      downloadSection.style.flexWrap = 'wrap'; // Wrap if necessary
      downloadSection.style.gap = '5px'; // Add some space between the links

      // Only add the links that exist
      if (links.libgen) {
        const listItem = document.createElement('li');
        listItem.style.display = 'block';
        const libgenLink = document.createElement('a');
        listItem.appendChild(libgenLink);

        libgenLink.href = links.libgen;
        libgenLink.textContent = 'Libgen';
        downloadSection.appendChild(listItem);
      }
      if (links.libgenRs) {
        const listItem = document.createElement('li');
        listItem.style.display = 'block';
        const libgenRsLink = document.createElement('a');
        listItem.appendChild(libgenRsLink);

        libgenRsLink.href = links.libgenRs;
        libgenRsLink.textContent = 'Libgen RS';
        downloadSection.appendChild(listItem);
      }
      if (links.zlib) {
        const listItem = document.createElement('li');
        listItem.style.display = 'block';
        const zlibLink = document.createElement('a');
        listItem.appendChild(zlibLink);

        zlibLink.href = links.zlib;
        zlibLink.textContent = 'Zlib';
        downloadSection.appendChild(listItem);
      }
    });
  }

  // Run the function to process items and observe dynamic changes
  window.addEventListener('load', () => {
    // Process existing items on page load
    const newObserver = ()=> new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        let node = mutation.target;
        if (!ishidden(node)) {
          observer.disconnect();
          processItem(node);
          break;
        }
      }
    });
    document.querySelectorAll('#aarecord-list > div').forEach(item => {
      if (ishidden(item)) { newObserver().observe(item, { attributeFilter: ['class'] }) }
      else { processItem(item) }
    });

  });
})();
