const container = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const sortBtn = document.getElementById("sortBtn");

let products = [];
let filteredProducts = [];

// Fetch products
async function fetchProducts() {
  try {
    const res = await fetch("https://dummyjson.com/products");
    const data = await res.json();
    products = data.products;
    filteredProducts = [...products];
    renderProducts(filteredProducts);
  } catch (err) {
    console.error(err);
  }
}

// Render products
function renderProducts(list) {
  container.innerHTML = "";

  list.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      <img src="${product.thumbnail}">
      <h3>${product.title}</h3>
      <p>$${product.price}</p>
      <button onclick="addToCart(${product.id})">Add to Cart</button>
    `;

    container.appendChild(card);
  });
}

// Search
searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase();
  filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(value)
  );
  renderProducts(filteredProducts);
});

// Sort
sortBtn.addEventListener("click", () => {
  filteredProducts.sort((a, b) => b.price - a.price);
  renderProducts(filteredProducts);
});

// Cart functions
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(id) {
  const cart = getCart();
  const product = products.find(p => p.id === id);

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
  updateCartCount();
  alert("Added to cart!");
}

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartCount = document.getElementById("cartCount");
  if (cartCount) cartCount.textContent = `🛒 ${total}`;
}

updateCartCount();
fetchProducts();
