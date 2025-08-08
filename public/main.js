// main.js

let allCars = [];
let normalized = [];
let selectedType = '';
let selectedBrand = '';

document.addEventListener('DOMContentLoaded', () => {
  const input       = document.getElementById('search-input');
  const suggestions = document.getElementById('suggestions');
  const searchForm  = document.querySelector('#search-box form');
  const typeDD      = document.getElementById('type');
  const brandDD     = document.getElementById('brand');
  const typeOpts    = document.getElementById('type-options');
  const brandOpts   = document.getElementById('brand-options');
  const typeLabel   = document.getElementById('type-label');
  const brandLabel  = document.getElementById('brand-label');
  const grid        = document.querySelector('.grid-container');

 
  fetch('/cars')
    .then(res => res.json())
    .then(cars => {
      allCars = cars;
      normalized = allCars.map(car =>
        (car.carType + ' ' + car.brand + ' ' + car.carModel + ' ' + car.description)
        .toLowerCase()
      );
      populateFilters();
      renderCars(allCars);
    })
    .catch(err => console.error('loading cars fail', err));

  function highlight(text, term) {
    const low = text.toLowerCase();
    const idx = low.indexOf(term);
    if (idx === -1) return text;
    return (
      text.slice(0, idx)
      + `<span class="highlight">${text.slice(idx, idx + term.length)}</span>`
      + text.slice(idx + term.length)
    );
  }

  function showSuggestions(value) {
    const q = value.toLowerCase().trim();
    if (!q) {
      suggestions.innerHTML = '';
      suggestions.classList.remove('visible');
      return;
    }

    const brandSet = new Set();
    const typeSet  = new Set();
    const descSnips = [];

    allCars.forEach(car => {
      if (car.brand.toLowerCase().startsWith(q))    brandSet.add(car.brand);
      if (car.carType.toLowerCase().startsWith(q))  typeSet.add(car.carType);
      const words = car.description.split(/\s+/);
      words.map(w=>w.toLowerCase()).forEach((w, i) => {
        if (w.startsWith(q)) {
          const start = Math.max(0, i-2), end = Math.min(words.length, i+3);
          descSnips.push(words.slice(start,end).join(' '));
        }
      });
    });

    const uniqueDesc = [...new Set(descSnips)].slice(0,5);
    const parts = [];

    if (brandSet.size) {
      parts.push(`<li class="suggestion-section">Brand:</li>`);
      [...brandSet].slice(0,5).forEach(b =>
        parts.push(`<li class="suggestion-brand">${highlight(b,q)}</li>`)
      );
    }
    if (typeSet.size) {
      parts.push(`<li class="suggestion-section">Type:</li>`);
      [...typeSet].slice(0,5).forEach(t =>
        parts.push(`<li class="suggestion-type">${highlight(t,q)}</li>`)
      );
    }
    if (uniqueDesc.length) {
      parts.push(`<li class="suggestion-section">Description:</li>`);
      uniqueDesc.forEach(snip =>
        parts.push(`<li class="suggestion-desc">${highlight(snip,q)}</li>`)
      );
    }

    suggestions.innerHTML = parts.join('');
    if (parts.length) suggestions.classList.add('visible');
    else              suggestions.classList.remove('visible');
  }

  input.addEventListener('input', () => {
    showSuggestions(input.value);
  });

  suggestions.addEventListener('click', e => {
    if (e.target.tagName==='LI' && !e.target.classList.contains('suggestion-section')) {
      input.value = e.target.textContent;
      suggestions.innerHTML = '';
      suggestions.classList.remove('visible');
      applyFiltersAndSearch();
    }
  });

  suggestions.addEventListener('mouseleave', () => {
    suggestions.classList.remove('visible');
  });

  document.getElementById('search-box')
    .addEventListener('mouseenter', () => {
      if (suggestions.innerHTML.trim()) {
        suggestions.classList.add('visible');
      }
    });

  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    suggestions.classList.remove('visible');
    applyFiltersAndSearch();
  });

  typeDD.addEventListener('click', () => {
    typeDD.classList.toggle('open');
    brandDD.classList.remove('open');
  });
  brandDD.addEventListener('click', () => {
    brandDD.classList.toggle('open');
    typeDD.classList.remove('open');
  });
  typeOpts.addEventListener('mouseleave', () => {
    typeDD.classList.remove('open');
  });
  brandOpts.addEventListener('mouseleave', () => {
    brandDD.classList.remove('open');
  });

  typeOpts.addEventListener('click', e => {
    if (e.target.tagName==='LI') {
      const val = e.target.textContent;
      if (val==='All') {
        selectedType = '';
        typeLabel.textContent = 'Type: All ˇ';
      } else {
        selectedType = val;
        typeLabel.textContent = `Type: ${val} ˇ`;
      }
      typeDD.classList.remove('open');
      applyFiltersAndSearch();
    }
  });
  brandOpts.addEventListener('click', e => {
    if (e.target.tagName==='LI') {
      const val = e.target.textContent;
      if (val==='All') {
        selectedBrand = '';
        brandLabel.textContent = 'Brand: All ˇ';
      } else {
        selectedBrand = val;
        brandLabel.textContent = `Brand: ${val} ˇ`;
      }
      brandDD.classList.remove('open');
      applyFiltersAndSearch();
    }
  });

  //Reservation Page
  grid.addEventListener('click', e => {
    if (e.target.classList.contains('reserve-button')) {
      const car = JSON.parse(decodeURIComponent(e.target.dataset.car));
      sessionStorage.setItem('selectedCar', JSON.stringify(car));
      window.location.href = 'reservation.html';
    }
  });
});


function populateFilters() {
  const types  = [...new Set(allCars.map(c=>c.carType))].sort();
  const brands = [...new Set(allCars.map(c=>c.brand))].sort();
  types.unshift('All');
  brands.unshift('All');
  document.getElementById('type-options').innerHTML  =
    types.map(t=>`<li>${t}</li>`).join('');
  document.getElementById('brand-options').innerHTML =
    brands.map(b=>`<li>${b}</li>`).join('');
}

function applyFiltersAndSearch() {
  const term = document.getElementById('search-input').value.toLowerCase().trim();
  let results = allCars;
  if (term)        results = results.filter((_,i)=>normalized[i].includes(term));
  if (selectedType)  results = results.filter(c=>c.carType===selectedType);
  if (selectedBrand) results = results.filter(c=>c.brand===selectedBrand);
  renderCars(results);
}

function renderCars(cars) {
  const grid = document.querySelector('.grid-container');
  grid.innerHTML = '';

  if (cars.length===0) {
    grid.innerHTML = `<div class="no-results">No cars match your search and filters.</div>`;
    return;
  }

  const groups = {};
  cars.forEach(car => {
    const key = `${car.brand}|${car.carModel}`;
    if (!groups[key]) groups[key] = {...car, availableCount:0};
    if (car.available) groups[key].availableCount++;
  });

  Object.values(groups).forEach(group => {
    const repCar = cars.find(c =>
      c.brand    === group.brand &&
      c.carModel === group.carModel &&
      c.available
    ) 
    || cars.find(c =>
      c.brand    === group.brand &&
      c.carModel === group.carModel
    );

    const html = `
      <div class="item-container">
        <img src="${repCar.image}" alt="${repCar.brand}_${repCar.carModel}" class="main-img"/>
        <div class="car-title-container">
          <div class="car-name">${repCar.brand}</div>
          <div class="car-model">${repCar.carModel}</div>
        </div>
        <div class="car-description">${repCar.description}</div>
        <div class="details-container">
          <div class="details-column">
            <div class="detail">
              <img src="img/car.svg" alt="car-icon" />
              <div>&nbsp;Type:&nbsp;<span>${repCar.carType}</span></div>
            </div>
            <div class="detail">
              <img src="img/seats.svg" alt="seats-icon" />
              <div>&nbsp;Seat:&nbsp;<span>${repCar.seat}</span></div>
            </div>
          </div>
          <div class="details-column">
            <div class="detail">
              <img src="img/year.svg" alt="year-icon" />
              <div>&nbsp;Year:&nbsp;<span>${repCar.yearOfManufacture}</span></div>
            </div>
            <div class="detail">
              <img src="img/power.svg" alt="power-icon" />
              <div>&nbsp;Power:&nbsp;<span>${repCar.fuelType}</span></div>
            </div>
          </div>
        </div>
        <div class="mile">
          <img src="img/mile.svg" alt="mile-icon" />
          <div>&nbsp;Mileage:&nbsp;<span>${repCar.mileage}</span></div>
        </div>
        <div class="detail-bottom-container">
          <div class="detail-bottom-container-left">
            <div class="daily-price">Price:&nbsp;<span>$${repCar.pricePerDay}</span>&nbsp;/day</div>
            <div class="availability">Remaining:&nbsp;<span>${group.availableCount}</span>&nbsp;units</div>
          </div>
          <div class="reserve-button-container">
            <div>&nbsp;</div>
            <button 
              class="reserve-button"
              data-car='${encodeURIComponent(JSON.stringify(repCar))}'
              ${group.availableCount === 0 ? 'disabled' : ''}
            >
              Reserve
            </button>
          </div>
        </div>
      </div>`;
    grid.insertAdjacentHTML('beforeend', html);
  });
}
