const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://waha:3000/api/sessions/default', {
      headers: { 'X-Api-Key': 'waha_secret_key_2024' }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
