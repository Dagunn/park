const emit = (element, name, detail) =>
  element.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));

const whenIdle = (fn) =>
  "requestIdleCallback" in window
    ? requestIdleCallback(fn, { timeout: 1000 })
    : setTimeout(fn, 200);

document.querySelectorAll("[data-menu-toggle]").forEach((button) => {
  const menu = button.closest("[data-menu]");

  button.addEventListener("click", () => {
    const open = menu.toggleAttribute("data-open");
    button.setAttribute("aria-expanded", String(open));
    emit(menu, "menu:toggle", { open });
  });
});

const hero = document.querySelector("[data-hero]");

if (hero) {
  const photos = hero.querySelectorAll("[data-hero-photo]");
  const slides = hero.querySelectorAll("[data-hero-slide]");
  const counter = hero.querySelector("[data-hero-counter]");
  const pad = (n) => String(n).padStart(2, "0");
  let current = 0;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => (slide.hidden = i !== current));
    photos.forEach((photo, i) =>
      photo.toggleAttribute("data-active", i === current),
    );
    counter.textContent = `${pad(current + 1)} — ${pad(slides.length)}`;
    emit(hero, "hero:change", { index: current, total: slides.length });
  };

  hero
    .querySelector("[data-hero-prev]")
    .addEventListener("click", () => show(current - 1));
  hero
    .querySelector("[data-hero-next]")
    .addEventListener("click", () => show(current + 1));
}

const marquee = document.querySelector("[data-marquee]");

if (marquee) {
  whenIdle(() => {
    const cards = [...marquee.children];
    const copies = cards.length % 2 ? 3 : 1;

    for (let i = 0; i < copies; i++) {
      cards.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("a").forEach((link) => (link.tabIndex = -1));
        marquee.append(clone);
      });
    }

    marquee.setAttribute("data-ready", "");
  });
}

document.querySelectorAll("[data-slider]").forEach((slider) => {
  const track = slider.querySelector("[data-slider-track]");
  const scroll = (direction) => {
    const { scrollLeft, scrollWidth, clientWidth } = track;
    const max = scrollWidth - clientWidth;
    const step = track.firstElementChild.offsetWidth;

    let left = scrollLeft + direction * step;
    if (direction > 0 && scrollLeft >= max - 1) left = 0;
    if (direction < 0 && scrollLeft <= 1) left = max;

    track.scrollTo({ left, behavior: "smooth" });
    emit(slider, "slider:change", { direction });
  };

  slider
    .querySelector("[data-slider-prev]")
    .addEventListener("click", () => scroll(-1));
  slider
    .querySelector("[data-slider-next]")
    .addEventListener("click", () => scroll(1));
});

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel-track]");
  let busy = false;

  const move = async (direction) => {
    if (busy || track.children.length < 2) return;
    busy = true;

    const step = track.children[1].offsetLeft - track.children[0].offsetLeft;
    const next = direction > 0;
    const leaving = next ? track.firstElementChild : track.lastElementChild;
    const copy = leaving.cloneNode(true);

    if (next) track.append(copy);
    else track.prepend(copy);

    const [from, to] = next ? [0, -step] : [-step, 0];
    const animations = [...track.children].map((item) =>
      item.animate(
        { translate: [`${from}px`, `${to}px`] },
        { duration: 500, easing: "ease-out", fill: "forwards" },
      ),
    );
    await Promise.all(animations.map((animation) => animation.finished));

    leaving.remove();
    animations.forEach((animation) => animation.cancel());

    busy = false;
    emit(carousel, "carousel:change", { direction });
  };

  carousel
    .querySelector("[data-carousel-prev]")
    .addEventListener("click", () => move(-1));
  carousel
    .querySelector("[data-carousel-next]")
    .addEventListener("click", () => move(1));
});

const mapFilter = document.querySelector("[data-map-filter]");
const map = document.querySelector("[data-map]");

mapFilter?.addEventListener("change", () => {
  const data = new FormData(mapFilter);
  const districts = data.getAll("district");
  const interests = data.getAll("interest");

  map.toggleAttribute(
    "data-filtered",
    districts.length > 0 || interests.length > 0,
  );

  map.querySelectorAll("[data-marker]").forEach((marker) => {
    const parkInterests = marker.dataset.interests.split(" ");
    const inDistrict =
      !districts.length || districts.includes(marker.dataset.district);
    const hasInterest =
      !interests.length ||
      interests.some((item) => parkInterests.includes(item));

    marker.toggleAttribute("data-match", inDistrict && hasInterest);
  });

  emit(mapFilter, "mapfilter:change", { districts, interests });
});

if (window.jQuery?.fn.select2) {
  whenIdle(() => {
    jQuery("select[data-select]").each((_, select) => {
      jQuery(select).select2({
        theme: "park",
        language: "ru",
        selectionCssClass: select.className,
      });
    });
  });
}
