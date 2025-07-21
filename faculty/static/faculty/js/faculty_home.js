//sidebar menu toggle
const sidebarMenu = document.getElementById("sidebarMenu");
const menuIcon = document.getElementById("menu-icon");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mainContent = document.getElementById("main-content");
menuIcon.addEventListener("click", () => {
  sidebarMenu.classList.toggle("show");
  sidebarOverlay.classList.toggle("show");
  mainContent.classList.toggle("with-sidebar");
});

sidebarOverlay.addEventListener("click", () => {
  sidebarMenu.classList.remove("show");
  sidebarOverlay.classList.remove("show");
  mainContent.classList.remove("with-sidebar");
});
