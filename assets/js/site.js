// VTC Liberty : formulaire de réservation -> e-mail ou WhatsApp pré-rempli. Aucun envoi vers un serveur tiers.
(function () {
  var form = document.querySelector('form.book');
  if (!form) return;
  var EMAIL = 'contact@vtc-liberty.fr';
  var WA = '33695336920';

  function compose() {
    var lines = [];
    form.querySelectorAll('[data-k]').forEach(function (el) {
      var v = (el.value || '').trim();
      if (v) lines.push(el.getAttribute('data-k') + ' : ' + v);
    });
    return lines.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var subject = form.getAttribute('data-subject');
    var via = e.submitter && e.submitter.value === 'whatsapp' ? 'whatsapp' : 'email';
    var body = compose();
    if (via === 'whatsapp') {
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(subject + '\n\n' + body), '_blank', 'noopener');
    } else {
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }
  });

  var d = form.querySelector('input[type=date]');
  if (d) {
    var t = new Date();
    d.min = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }
})();
