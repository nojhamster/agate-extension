if (window.location.host.endsWith('agateb.cnrs.fr')) {
  require('../extension/content_script.js')
}

if (window.location.host === 'janus.cnrs.fr') {
  window.addEventListener('load', () => {
    const username = document.getElementById('username')
    username.value = localStorage.getItem('username') || ''

    username.addEventListener('change', event => {
      localStorage.setItem('username', event.target.value)
    })
  })
}
