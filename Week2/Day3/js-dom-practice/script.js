const headers = document.querySelectorAll(".ques");

headers.forEach(header => {
  header.addEventListener("click", () => {

    const content = header.nextElementSibling;
    const icon = header.querySelector(".icon");

    // Close all other accordions
    headers.forEach(h => {
      if (h !== header) {
        h.classList.remove("active");
        h.nextElementSibling.classList.remove("open");
        h.querySelector(".icon").textContent = "+";
      }
    });

    // Toggle current accordion
    header.classList.toggle("active");
    content.classList.toggle("open");

    icon.textContent = content.classList.contains("open") ? "−" : "+";
  });
});
