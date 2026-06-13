const axios = require('axios');
async function logout() {
  try {
    const res = await axios.post('http://waha:3000/api/sessions/default/logout', {}, {
      headers: { 'X-Api-Key': 'waha_secret_key_2024' }
    });
    console.log("Logged out successfully:", res.status);
  } catch (err) {
    console.error("Logout failed:", err.response ? err.response.data : err.message);
  }
}
logout();
