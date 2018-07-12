if (window.location.host.endsWith('agateb.cnrs.fr')) {
  require('./agate.js')
}

if (window.location.host === 'cas.cnrs.fr') {
  window.addEventListener('load', () => {
    const username = document.getElementById('username')
    username.value = localStorage.getItem('username') || ''

    username.addEventListener('change', event => {
      localStorage.setItem('username', event.target.value)
    })
  })
}
