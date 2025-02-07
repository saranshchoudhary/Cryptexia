const form = document.getElementById('encryption-form');
const resultDiv = document.getElementById('result');
const encryptedPasswordEl = document.getElementById('encrypted-password');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const password = document.getElementById('password').value;
  const algorithm = document.getElementById('algorithm').value;

  try {
    const response = await axios.post('http://localhost:3000/encrypt', { password, algorithm });
    encryptedPasswordEl.textContent = response.data.encryptedPassword;
    resultDiv.classList.remove('hidden');
  } catch (error) {
    alert('Error encrypting password: ' + error.response?.data?.message || error.message);
  }
});