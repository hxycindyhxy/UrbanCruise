// reservation.js

document.addEventListener('DOMContentLoaded', () => {

  const STORAGE_KEY = 'reservationForm';

  const inputs = {
    startDate:    document.getElementById('start-date'),
    endDate:      document.getElementById('end-date'),
    firstName:    document.getElementById('first-name-input'),
    lastName:     document.getElementById('last-name-input'),
    license:      document.getElementById('driver-license-input'),
    mobile:       document.getElementById('mobile-input'),
    email:        document.getElementById('email-input')
  };

  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  for (const [key, input] of Object.entries(inputs)) {
    if (saved[key]) {
      input.value = saved[key];
    }
  }

  function saveForm() {
    const data = {};
    for (const [key, input] of Object.entries(inputs)) {
      data[key] = input.value;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  Object.values(inputs).forEach(input => {
    input.addEventListener('change', saveForm);
  });


  const stored = JSON.parse(sessionStorage.getItem('selectedCar') || '{}');
  const noSelectMsg = document.getElementById('no-selection-message');
  const optionBlock = document.getElementById('option-available');
  const noAvailMsg  = document.getElementById('no-availability-message');


  if (!stored.brand) {
    noSelectMsg.style.display      = 'block';
    document.getElementById('car-info-step').style.display    = 'none';
    document.getElementById('car-info-section').style.display = 'none';
    optionBlock.style.display      = 'none';
    if (noAvailMsg) noAvailMsg.style.display = 'none';
    return;
  }

  noSelectMsg.style.display = 'none';

  fetch(`/availability?vin=${stored.vin}`)
    .then(res => res.json())
    .then(({ available }) => {
      if (available) {
        optionBlock.style.display = '';    
        noAvailMsg.style.display  = 'none'; 
        initPageWithCar(stored, 1);        
      } else {
        optionBlock.style.display = 'none';
        noAvailMsg.style.display  = 'block';
      }
    })
    .catch(err => {
      console.error('检查可用性失败', err);
      optionBlock.style.display = 'none';
      noAvailMsg.style.display  = 'block';
    });
  

  const cancelBtn = document.getElementById('cancel-btn');
  cancelBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('selectedCar');
    window.location.href = 'index.html';
  });

  const chooseBtn = document.getElementById('no-availability-home-button');
  if (chooseBtn) {
    chooseBtn.addEventListener('click', () => {
      sessionStorage.removeItem('selectedCar');
    });
  }
});


function initPageWithCar(car) {

  document.querySelector('.car-info-img').src = car.image;
  document.querySelector('.car-info-img').alt = `${car.brand}_${car.carModel}`;
  document.querySelector('.car-name').textContent = `${car.brand} ${car.carModel}`;
  document.querySelector('.car-description').textContent = car.description;

  document.querySelectorAll('.car-more-info .detail').forEach(el => {
    const key = el.querySelector('span').parentNode.textContent.match(/^\s*(\w+):/)[1];
    switch(key) {
      case 'Type':
        el.querySelector('span').textContent = car.carType;
        break;
      case 'Seat':
        el.querySelector('span').textContent = car.seat;
        break;
      case 'Year':
        el.querySelector('span').textContent = car.yearOfManufacture;
        break;
      case 'Power':
        el.querySelector('span').textContent = car.fuelType;
        break;
      case 'Mile':
        el.querySelector('span').textContent = car.mileage;
        break;
    }
  });

  const startInput = document.getElementById('start-date');
  const endInput   = document.getElementById('end-date');

  function toYMD(d) {
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth()+1).padStart(2, '0');
    const dd   = String(d.getDate()   ).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const today = new Date();
  startInput.min = toYMD(today);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  endInput.min = toYMD(tomorrow);

  startInput.value = toYMD(today);
  endInput.value   = toYMD(tomorrow);

  startInput.addEventListener('change', () => {
    const s = new Date(startInput.value);
    const minEnd = new Date(s);
    minEnd.setDate(minEnd.getDate() + 1);
    endInput.min = toYMD(minEnd);
    if (new Date(endInput.value) < minEnd) {
      endInput.value = toYMD(minEnd);
    }
  });

  const daysSpan = document.querySelector('.rental-title span');

  function updateTotalDays() {
    const start = new Date(startInput.value);
    const end   = new Date(endInput.value);
    const diffMs = end - start;
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    daysSpan.textContent = days;
  }

  startInput.addEventListener('change', updateTotalDays);
  endInput.addEventListener('change',   updateTotalDays);

  updateTotalDays();

  const firstNameInput = document.getElementById('first-name-input');
  const lastNameInput  = document.getElementById('last-name-input');
  const mobileInput    = document.getElementById('mobile-input');
  const licenseInput   = document.getElementById('driver-license-input');
  const emailInput     = document.getElementById('email-input');
  const placeOrderBtn  = document.getElementById('place-order-btn');
  placeOrderBtn.disabled = true;

  let firstNamePass = false;
  let lastNamePass  = false;
  let mobilePass    = false;
  let licensePass   = false;
  let emailPass     = false;

  function changeOrderBtnStatus() {
    placeOrderBtn.disabled = !(
      firstNamePass &&
      lastNamePass &&
      mobilePass &&
      licensePass &&
      emailPass
    );
  }

  [ firstNameInput, lastNameInput, mobileInput, licenseInput, emailInput ]
    .forEach(input => {
      input.addEventListener('focus', () => {
        input.dataset.touched = 'true';
        const alertBox = document.getElementById(input.id + '-alert');
        if (alertBox) alertBox.innerHTML = '';
        input.style.outline = '0';
      });
    });

  firstNameInput.addEventListener('blur', () => {
    if (!firstNameInput.dataset.touched) return;
    const alertBox = document.getElementById('first-name-alert');
    alertBox.innerHTML = '';
    if (!firstNameInput.value.trim()) {
      alertBox.insertAdjacentHTML('beforeend',
        `<div class="alert-msg">&nbsp;*Please enter your first name.</div>`
      );
      firstNameInput.style.outline = '#cf532d 1.5px solid';
      firstNamePass = false;
    } else {
      firstNamePass = true;
    }
    changeOrderBtnStatus();
  });

  lastNameInput.addEventListener('blur', () => {
    if (!lastNameInput.dataset.touched) return;
    const alertBox = document.getElementById('last-name-alert');
    alertBox.innerHTML = '';
    if (!lastNameInput.value.trim()) {
      alertBox.insertAdjacentHTML('beforeend',
        `<div class="alert-msg">&nbsp;*Please enter your last name.</div>`
      );
      lastNameInput.style.outline = '#cf532d 1.5px solid';
      lastNamePass = false;
    } else {
      lastNamePass = true;
    }
    changeOrderBtnStatus();
  });

  mobileInput.addEventListener('blur', () => {
    if (!mobileInput.dataset.touched) return;
    const alertBox = document.getElementById('mobile-alert');
    alertBox.innerHTML = '';
    const v = mobileInput.value.trim();
    if (!/^\d{9,}$/.test(v)) {
      alertBox.insertAdjacentHTML('beforeend',
        `<div class="alert-msg">&nbsp;*Please enter a valid mobile number.</div>`
      );
      mobileInput.style.outline = '#cf532d 1.5px solid';
      mobilePass = false;
    } else {
      mobilePass = true;
    }
    changeOrderBtnStatus();
  });

  licenseInput.addEventListener('blur', () => {
    if (!licenseInput.dataset.touched) return;
    const alertBox = document.getElementById('driver-license-alert');
    alertBox.innerHTML = '';
    const v = licenseInput.value.trim();
    if (!/^\d{10,}$/.test(v)) {
      alertBox.insertAdjacentHTML('beforeend',
        `<div class="alert-msg">&nbsp;*Please enter a valid Australian license number.</div>`
      );
      licenseInput.style.outline = '#cf532d 1.5px solid';
      licensePass = false;
    } else {
      licensePass = true;
    }
    changeOrderBtnStatus();
  });

  emailInput.addEventListener('blur', () => {
    if (!emailInput.dataset.touched) return;
    const alertBox = document.getElementById('email-alert');
    alertBox.innerHTML = '';
    const val = emailInput.value.trim();
    const ok  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (!ok) {
      alertBox.insertAdjacentHTML('beforeend',
        `<div class="alert-msg">&nbsp;*Please enter a valid email.</div>`
      );
      emailInput.style.outline = '#cf532d 1.5px solid';
      emailPass = false;
    } else {
      emailPass = true;
    }
    changeOrderBtnStatus();
  });
  
  const priceSpan = document.querySelector('#total-price span');

  function updateTotals() {
    const start = new Date(startInput.value);
    const end   = new Date(endInput.value);
    const diffMs = end - start;
    const days   = Math.round(diffMs / (1000 * 60 * 60 * 24));

    daysSpan.textContent  = days;
    priceSpan.textContent = days * car.pricePerDay;
  }

  startInput.addEventListener('change', updateTotals);
  endInput.addEventListener('change', updateTotals);
  
  updateTotals();

  [ firstNameInput, lastNameInput, mobileInput, licenseInput, emailInput ]
  .forEach(input => input.dataset.touched = 'true');

  firstNamePass = !!firstNameInput.value.trim();
  lastNamePass  = !!lastNameInput.value.trim();
  mobilePass    = /^\d{9,}$/.test(mobileInput.value.trim());
  licensePass   = /^\d{10,}$/.test(licenseInput.value.trim());
  emailPass     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());

  changeOrderBtnStatus();

  placeOrderBtn.addEventListener('click', async () => {
    const stored = JSON.parse(sessionStorage.getItem('selectedCar') || '{}');

    try {
      const availRes = await fetch(`/availability?vin=${stored.vin}`);
      const { available } = await availRes.json();

      if (!available) {
        document.getElementById('option-available').style.display    = 'none';
        document.getElementById('no-availability-message').style.display = 'block';
        return;  
      }
    } catch (err) {
      console.error('availability check fail', err);
      alert('availbility check fail, try again');
      return;
    }

    const order = {
      customer: {
        name: firstNameInput.value,
        phoneNumber: mobileInput.value,
        email: emailInput.value,
        driversLicenseNumber: licenseInput.value
      },
      car: { vin: stored.vin }, 
      rental: {
        startDate: startInput.value,
        rentalPeriod: parseInt(daysSpan.textContent, 10),
        totalPrice: parseInt(priceSpan.textContent, 10),
        orderDate: new Date().toISOString().slice(0,10)
      }
    };

    try {
      const resp = await fetch('/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      const result = await resp.json();
      if (result.success) {
        window.location.href = 'confirm.html';
      } else {
        alert('order fail, try again');
      }
    } catch (err) {
      console.error('order fail', err);
      alert('network problem, please try again');
    }
  });
};