document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarToggle = document.getElementById('sidebarToggle');

    // --- Sidebar Toggle Logic ---
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            // On smaller screens, the sidebar overlays, so main content margin doesn't need to change here.
            // On larger screens, this toggle isn't typically used as sidebar is fixed open or closed.
        });
    }

    // --- Dummy Data (same as before) ---
    
    const totalClasses = 50;
    const averagePunctuality = 100;
    const monthlyData = { Jan: 70, Feb: 85, Mar: 60, Apr: 90, May: 78 };
    const courseData = { CS101: 92, MA203: 75, PHY105: 88, EE201: 81 };

    // --- Update Dashboard Summary Cards (same as before) ---
    const overallPercentageEl = document.getElementById('overallPercentage');
    const classesConductedEl = document.getElementById('classesConducted');
    const avgPunctualityEl = document.getElementById('avgPunctuality');

    if (overallPercentageEl) overallPercentageEl.textContent = `${overallAttendance}%`;
    if (classesConductedEl) classesConductedEl.textContent = `${classesConducted}/${totalClasses}`;
    if (avgPunctualityEl) avgPunctualityEl.textContent = `${averagePunctuality}%`;

    // --- Update Bar Charts (same as before) ---
    const monthlyChartBars = document.querySelectorAll('.attendance-charts .chart:nth-of-type(1) .bar');
    const monthlyChartValues = document.querySelectorAll('.attendance-charts .chart:nth-of-type(1) .bar-value');
    const monthlyKeys = Object.keys(monthlyData);

    monthlyChartBars.forEach((bar, index) => {
        if (monthlyKeys[index]) {
            bar.style.height = `${monthlyData[monthlyKeys[index]]}%`;
        }
    });
    monthlyChartValues.forEach((valueEl, index) => {
         if (monthlyKeys[index]) {
            valueEl.textContent = `${monthlyData[monthlyKeys[index]]}%`;
        }
    });

    const courseChartBars = document.querySelectorAll('.attendance-charts .chart:nth-of-type(2) .bar');
    const courseChartValues = document.querySelectorAll('.attendance-charts .chart:nth-of-type(2) .bar-value');
    const courseKeys = Object.keys(courseData);

    courseChartBars.forEach((bar, index) => {
        if (courseKeys[index]) {
            bar.style.height = `${courseData[courseKeys[index]]}%`;
        }
    });
    courseChartValues.forEach((valueEl, index) => {
         if (courseKeys[index]) {
            valueEl.textContent = `${courseData[courseKeys[index]]}%`;
        }
    });

    // --- Event Listeners for Sidebar Links ---
    const sidebarNewAttendance = document.getElementById('sidebarNewAttendance');
    const sidebarLogout = document.getElementById('sidebarLogout');
    const navLinks = document.querySelectorAll('.sidebar-nav li a');

    function handleSidebarLinkActivation(clickedLink) {
        navLinks.forEach(l => l.classList.remove('active-link'));
        clickedLink.classList.add('active-link');
         // If sidebar is open on mobile, close it after clicking a link
        if (window.innerWidth <= 992 && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    }

    // if (sidebarNewAttendance) {
    //     sidebarNewAttendance.addEventListener('click', function(e) {
    //         e.preventDefault();
    //         handleSidebarLinkActivation(this);
    //         console.log('Sidebar New Attendance Form clicked');
    //         alert("Redirecting to New Attendance Form (not implemented in this demo).");
    //     });
    // }

    // if (sidebarLogout) {
    //     sidebarLogout.addEventListener('click', function(e) {
    //         e.preventDefault();
    //         handleSidebarLinkActivation(this); // Though for logout, active state might not matter
    //         console.log('Sidebar Logout clicked');
    //         alert("Logout clicked (not implemented in this demo).");
    //     });
    // }


    // // --- Event Listeners for Mobile Header Action Buttons ---
    // const mobileNewAttendanceBtn = document.getElementById('mobileNewAttendanceBtn');
    // const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

    // if (mobileNewAttendanceBtn) {
    //     mobileNewAttendanceBtn.addEventListener('click', (e) => {
    //         e.preventDefault();
    //         console.log('Mobile Header New Attendance Form clicked');
    //         alert("Redirecting to New Attendance Form (not implemented in this demo).");
    //         // If sidebar is open, you might want to close it
    //         if (sidebar.classList.contains('active')) {
    //             sidebar.classList.remove('active');
    //         }
    //     });
    // }

    // if (mobileLogoutBtn) {
    //     mobileLogoutBtn.addEventListener('click', (e) => {
    //         e.preventDefault();
    //         console.log('Mobile Header Logout clicked');
    //         alert("Logout clicked (not implemented in this demo).");
    //         // Implement actual logout logic here
    //         if (sidebar.classList.contains('active')) {
    //             sidebar.classList.remove('active');
    //         }
    //     });
    // }

    // --- Adjust layout based on window size (initial load and resize) ---
    function handleResize() {
        if (window.innerWidth > 992) {
            sidebar.classList.remove('active'); // Ensure mobile 'active' state is off
            mainContent.style.marginLeft = '260px'; // Sidebar width
            sidebar.style.transform = 'translateX(0)'; // Keep sidebar visible
            if(sidebarToggle) sidebarToggle.style.display = 'none';
        } else {
            // On smaller screens, sidebar is toggled, so margin-left is 0
            // and transform is controlled by 'active' class.
            mainContent.style.marginLeft = '0';
            if (!sidebar.classList.contains('active')) { // Ensure it's hidden if not active
                 sidebar.style.transform = 'translateX(-100%)';
            }
            if(sidebarToggle) sidebarToggle.style.display = 'block';
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Call on initial load
});