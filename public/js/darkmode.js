const btn = document.getElementById('toggleDark');
    const html = document.documentElement;

    // Verificar tema salvo
    if (localStorage.getItem('theme') === 'dark') {
      html.classList.add('dark');
      btn.textContent = '☀️ Claro';
    }

    btn.addEventListener('click', () => {
      const isDark = html.classList.toggle('dark');
      btn.textContent = isDark ? '☀️ Claro' : '🌙 Escuro';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });