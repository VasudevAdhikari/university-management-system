document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to recovery options
    const recoveryOptions = document.querySelectorAll('.recovery-option:not(.disabled)');
    
    recoveryOptions.forEach(option => {
        option.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
        });
        
        option.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        });
    });
}); 