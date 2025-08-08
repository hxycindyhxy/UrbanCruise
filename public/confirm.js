// confirm.js
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('successful').style.display = 'block';

  sessionStorage.removeItem('selectedCar');
  localStorage.removeItem('reservationForm');
});