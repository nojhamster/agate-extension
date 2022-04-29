if (window.location.host === 'agate-tempo.cnrs.fr') {
  require('../extension/content_script.js')
}

if (window.location.host === 'janus.cnrs.fr') {
  window.addEventListener('load', () => {
    const usernameInput = document.getElementById('username')
    const passwordInput = document.getElementById('password')

    if (!usernameInput) { return; }

    usernameInput.value = localStorage.getItem('username') || ''

    usernameInput.addEventListener('change', event => {
      localStorage.setItem('username', event.target.value)
    })

    if (usernameInput.value && passwordInput) {
      passwordInput.focus()
    }
  })
}
