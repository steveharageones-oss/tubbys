// Tubby's Tumblerz - Dynamic Etsy Integration + Custom Form
(function () {
  "use strict";

  const API_ENDPOINT = "/.netlify/functions/etsy";
  const ETSY_SHOP_URL = "https://www.etsy.com/shop/TubbysTumblerz";

  // DOM Elements
  const productGrid = document.getElementById("product-grid");
  const loadingState = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");
  const errorDetail = document.getElementById("error-detail");
  const shopLink = document.getElementById("shop-link");

  // Fetch products from Netlify serverless function
  async function fetchProducts() {
    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) throw new Error("API returned " + response.status);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      console.error("Failed to fetch products:", err);
      throw err;
    }
  }

  // Format price with currency symbol
  function formatPrice(amount, currency) {
    var symbols = { USD: "$", EUR: "€", GBP: "£", CAD: "CA$", AUD: "A$" };
    var symbol = symbols[currency] || currency + " ";
    return symbol + parseFloat(amount).toFixed(2);
  }

  // Truncate text
  function truncate(text, maxLen) {
    if (!text) return "";
    text = text.replace(/
/g, " ").replace(/\s+/g, " ").trim();
    return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
  }

  // Create a product card element
  function createProductCard(product) {
    var card = document.createElement("a");
    card.href = product.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.className = "product-card";
    card.setAttribute("aria-label", "View " + product.title + " on Etsy");

    var safeTitle = product.title.replace(/"/g, "&quot;");
    card.innerHTML =
      '<div class="product-image">' +
        '<img src="' + product.image + '" alt="' + safeTitle + '" loading="lazy" ' +
          'onerror="this.src='data:image/svg+xml,<svg xmlns=http://www.w3.org/2000/svg viewBox=0_0_400_400><rect fill=%23f0f8ff width=400 height=400/><text x=200 y=200 text-anchor=middle fill=%230099FF font-size=20>Image Unavailable</text></svg>'" />' +
        '<div class="water-overlay"></div>' +
      '</div>' +
      '<div class="product-info">' +
        '<h3>' + truncate(product.title, 60) + '</h3>' +
        '<p class="description">' + truncate(product.description, 120) + '</p>' +
        '<div class="product-footer">' +
          '<span class="price">' + formatPrice(product.price, product.currency) + '</span>' +
          '<span class="view-btn">View on Etsy</span>' +
        '</div>' +
      '</div>';

    return card;
  }

  // Render products into the grid
  function renderProducts(data) {
    loadingState.style.display = "none";
    var products = data.products;
    var shop = data.shop;

    if (!products || products.length === 0) {
      errorState.style.display = "flex";
      errorDetail.textContent = "No products are currently listed.";
      shopLink.style.display = "block";
      return;
    }

    var fragment = document.createDocumentFragment();
    products.forEach(function (product) {
      fragment.appendChild(createProductCard(product));
    });
    productGrid.appendChild(fragment);

    shopLink.style.display = "block";
    if (shop && shop.url) {
      var visitBtn = shopLink.querySelector(".visit-shop-btn");
      if (visitBtn) visitBtn.href = shop.url;
    }

    // Stagger animation
    var cards = productGrid.querySelectorAll(".product-card");
    cards.forEach(function (card, i) {
      card.style.opacity = "0";
      card.style.transform = "translateY(30px)";
      setTimeout(function () {
        card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, i * 100);
    });
  }

  // Show error state
  function showError(err) {
    loadingState.style.display = "none";
    errorState.style.display = "flex";
    errorDetail.textContent = err.message || "Please try again later.";
  }

  // Mobile menu toggle
  function initMobileMenu() {
    var btn = document.querySelector(".mobile-menu-btn");
    var menu = document.querySelector(".nav-menu");
    if (btn && menu) {
      btn.addEventListener("click", function () {
        btn.classList.toggle("active");
        menu.classList.toggle("active");
      });
      menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          btn.classList.remove("active");
          menu.classList.remove("active");
        });
      });
    }
  }

  // Smooth scroll for anchor links
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute("href"));
        if (target) {
          var navHeight = document.querySelector(".navbar").offsetHeight;
          var targetPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
          window.scrollTo({ top: targetPos, behavior: "smooth" });
        }
      });
    });
  }



  // Detect form submission success from Formsubmit redirect
  function checkFormSuccess() {
    if (window.location.hash === '#success') {
      var form = document.querySelector('.custom-form');
      if (form) {
        form.innerHTML =
          '<div class="form-success">' +
            '<span class="success-icon">✅</span>' +
            '<h3>Request Sent!</h3>' +
            '<p>Thanks for your custom tumbler request! We'll get back to you within 24-48 hours at the email you provided.</p>' +
            '<p class="success-email">Questions? Email us at <a href="mailto:tubbystumblerz@gmail.com">tubbystumblerz@gmail.com</a></p>' +
          '</div>';
        // Scroll to the form section
        var section = document.getElementById('custom-request');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      }
      // Clean up URL
      history.replaceState(null, '', window.location.pathname);
    }
  }

  // Initialize
  function init() {
    initMobileMenu();
    initSmoothScroll();
    checkFormSuccess();
    fetchProducts().then(renderProducts).catch(showError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
