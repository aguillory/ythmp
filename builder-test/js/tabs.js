export function setupTabNavigation() {
    const tabLinks = document.querySelectorAll('.tablink');
    
    const openTab = (event, tabId) => {
        document.querySelectorAll('.tabcontent').forEach(content => {
            content.style.display = 'none';
        });

        tabLinks.forEach(l => {
            l.classList.remove('active');
        });

        document.getElementById(tabId).style.display = 'block';
        if (event) {
            event.currentTarget.classList.add('active');
        }
    };

    tabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const tabId = event.target.getAttribute('data-tab');
            openTab(event, tabId);
        });
    });

    if (document.getElementById('newMapTab')) {
        openTab(null, 'newMapTab');
        if (tabLinks.length > 0) tabLinks[0].classList.add('active');
    }
}