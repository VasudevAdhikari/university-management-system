window.addEventListener('load', () => {
    // console.log("loaded");
    document.getElementById('student-register').addEventListener('click', ()=>{
        // console.log("student register")
        sessionStorage.setItem('role', 'student');
        window.location.href = '/auth/register/'
    });
    
    document.getElementById('student-login').addEventListener('click', ()=>{
        sessionStorage.setItem('role', 'student');
        window.location.href = '/auth/login/'
    });
    
    document.getElementById('instructor-register').addEventListener('click', ()=>{
        sessionStorage.setItem('role', 'instructor');
        window.location.href = '/auth/register/'
    });
    
    document.getElementById('instructor-login').addEventListener('click', ()=>{
        sessionStorage.setItem('role', 'instructor');
        window.location.href = '/auth/login/'
    });
});



// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
}); 

// Add animation to cards when they come into view
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate__animated', 'animate__fadeInUp');
        }
    });
}, {
    threshold: 0.1
});

document.querySelectorAll('.card').forEach(card => {
    observer.observe(card);
}); 