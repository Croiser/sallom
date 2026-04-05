const token = localStorage.getItem('token');
console.log('Token:', token ? 'exists' : 'none');

fetch('/api/superadmin/plans', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Plans:', JSON.stringify(d, null, 2)))
.catch(e => console.error('Error:', e));