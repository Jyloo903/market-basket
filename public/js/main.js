// Main JavaScript untuk Market Basket Analysis

// Auto-close alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
  const alerts = document.querySelectorAll('.alert-dismissible');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 5000);
  });

  // Add active class to current nav link
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
});

// Delete confirmation helper
function confirmDelete(message = 'Apakah Anda yakin ingin menghapus?') {
  return confirm(message);
}

// Format number to Indonesian format
function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

// Format percentage
function formatPercent(num) {
  return (num * 100).toFixed(2) + '%';
}

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

// Delete analysis function
function deleteAnalysis(id) {
  if (confirm('Apakah Anda yakin ingin menghapus analisis ini?')) {
    fetch(`/mining/delete/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(data.message);
          location.reload();
        } else {
          alert(data.message);
        }
      })
      .catch(err => {
        console.error('Error:', err);
        alert('Gagal menghapus analisis');
      });
  }
}

// Delete user function (admin only)
function deleteUser(id, name) {
  if (confirm(`Apakah Anda yakin ingin menghapus user "${name}"?\nSemua data analisis user ini juga akan dihapus.`)) {
    fetch(`/admin/users/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        if (data.success) {
          location.reload();
        }
      })
      .catch(err => {
        console.error('Error:', err);
        alert('Gagal menghapus user');
      });
  }
}

// Loading state for form submission
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const submitBtn = this.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
      }
    });
  });
});

// File input validation
document.addEventListener('DOMContentLoaded', function() {
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    input.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          alert('File terlalu besar! Maksimal 10MB.');
          this.value = '';
        }
        
        // Show file name
        const label = this.parentElement.querySelector('small') || this.nextElementSibling;
        if (label) {
          label.textContent = `File dipilih: ${file.name}`;
        }
      }
    });
  });
});

// Auto calculate lift color
function getLiftColor(lift) {
  if (lift > 2) return 'success';
  if (lift > 1) return 'warning';
  return 'danger';
}

// Export functions to global scope
window.deleteAnalysis = deleteAnalysis;
window.deleteUser = deleteUser;
window.confirmDelete = confirmDelete;