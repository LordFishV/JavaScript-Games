import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/style.css";
import "bootstrap";

const root = document.body.dataset.root ?? "";

const links = [1, 2, 3, 4, 5]
  .map((n) => `<li><a class="dropdown-item" href="${root}element${n}/">Element ${n}</a></li>`)
  .join("");

const nav = document.getElementById("site-nav");
if (nav) {
  nav.innerHTML = `
  <nav class="navbar navbar-expand-lg bg-body-tertiary">
    <div class="container">
      <a class="navbar-brand" href="${root}">Scot McCombie</a>
      <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navMenu">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navMenu">
        <ul class="navbar-nav">
          <li class="nav-item"><a class="nav-link" href="${root}">Home</a></li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Elements</a>
            <ul class="dropdown-menu">${links}</ul>
          </li>
          <li class="nav-item"><a class="nav-link" href="${root}documentation/">Documentation</a></li>
        </ul>
      </div>
    </div>
  </nav>`;
}