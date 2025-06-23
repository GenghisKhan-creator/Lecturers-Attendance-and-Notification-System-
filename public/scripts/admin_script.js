document.addEventListener('DOMContentLoaded', function () {
    // --- Mock Data (Replace with actual data from your backend) ---
    const totalLecturersCount = 50;
    const totalPresentCount = 35;
    const totalAbsentCount = 15;

    // Calculate percentages
    const presentPercentageVal = totalLecturersCount > 0 ? ((totalPresentCount / totalLecturersCount) * 100).toFixed(1) : 0;
    const absentPercentageVal = totalLecturersCount > 0 ? ((totalAbsentCount / totalLecturersCount) * 100).toFixed(1) : 0;

    const recentActivities = [
        { time: '09:02 AM', lecturer: 'Dr. Smith', status: 'Present', department: 'Physics' },
        { time: '09:05 AM', lecturer: 'Prof. Jones', status: 'Absent', department: 'Mathematics' },
        { time: '09:10 AM', lecturer: 'Dr. Elara', status: 'Present', department: 'Computer Science' },
        { time: '09:15 AM', lecturer: 'Mr. Ben', status: 'Late', department: 'Literature' },
        { time: '09:20 AM', lecturer: 'Ms. Anna', status: 'Present', department: 'Biology' },
    ];

    const presentAbsentPieData = {
        labels: ['Present', 'Absent'],
        datasets: [{
            label: 'Lecturer Status',
            data: [totalPresentCount, totalAbsentCount],
            backgroundColor: [
                'rgba(26, 188, 156, 0.8)', // --secondary-color
                'rgba(231, 76, 60, 0.8)'  // Reddish
            ],
            borderColor: [
                'rgba(26, 188, 156, 1)',
                'rgba(231, 76, 60, 1)'
            ],
            borderWidth: 1
        }]
    };

    // Get last 7 days labels
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    const dailyTrendData = {
        labels: last7Days,
        datasets: [
            {
                label: 'Present',
                data: [30, 32, 35, 33, 36, 38, totalPresentCount], // Sample data for past days
                backgroundColor: 'rgba(26, 188, 156, 0.7)',
                borderColor: 'rgba(26, 188, 156, 1)',
                borderWidth: 1
            },
            {
                label: 'Absent',
                data: [5, 3, 2, 4, 1, 2, totalAbsentCount], // Sample data
                backgroundColor: 'rgba(231, 76, 60, 0.7)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 1
            }
        ]
    };

    const lecturerOverview = [
        { id: 'LEC001', name: 'Dr. Alice Wonderland', department: 'Computer Science', status: 'Present', lastSeen: '09:15 AM' },
        { id: 'LEC002', name: 'Prof. Bob The Builder', department: 'Engineering', status: 'Absent', lastSeen: '-' },
        { id: 'LEC003', name: 'Dr. Carol Danvers', department: 'Physics', status: 'Present', lastSeen: '08:50 AM' },
        { id: 'LEC004', name: 'Mr. David Copperfield', department: 'Arts', status: 'Present', lastSeen: '09:30 AM' },
        { id: 'LEC005', name: 'Ms. Eva Green', department: 'Literature', status: 'Late', lastSeen: '09:05 AM (Late)' },
    ];


    // --- Populate Summary Cards ---
    document.getElementById('totalLecturers').textContent = totalLecturersCount;
    document.getElementById('totalPresent').textContent = totalPresentCount;
    document.getElementById('totalAbsent').textContent = totalAbsentCount;
    document.getElementById('presentPercentage').textContent = `${presentPercentageVal}% Present`;
    document.getElementById('absentPercentage').textContent = `${absentPercentageVal}% Absent`;

    // --- Populate Recent Activities ---
    const activitiesList = document.getElementById('recentActivitiesList');
    if (activitiesList) {
        activitiesList.innerHTML = ''; // Clear existing
        recentActivities.slice(0, 10).forEach(activity => { // Show latest 10 or so
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div>
                    <span class="activity-time">${activity.time}</span>
                    <span class="activity-lecturer">${activity.lecturer}</span>
                    (${activity.department})
                </div>
                <span class="status ${activity.status.toLowerCase()}">${activity.status}</span>`;
            activitiesList.appendChild(listItem);
        });
    }

    // --- Initialize Charts ---
    const pieCtx = document.getElementById('presentAbsentPieChart')?.getContext('2d');
    if (pieCtx) {
        new Chart(pieCtx, {
            type: 'pie',
            data: presentAbsentPieData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += context.parsed;
                                }
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%';
                                label += ` (${percentage})`;
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    const barCtx = document.getElementById('dailyTrendBarChart')?.getContext('2d');
    if (barCtx) {
        new Chart(barCtx, {
            type: 'bar',
            data: dailyTrendData,
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: true, // Stack present and absent bars
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Lecturers'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }

    // --- Populate Lecturer Overview Table ---
    const overviewBody = document.getElementById('lecturerOverviewBody');
    if (overviewBody) {
        overviewBody.innerHTML = ''; // Clear existing
        lecturerOverview.forEach(lecturer => {
            const row = `<tr>
                            <td>${lecturer.id}</td>
                            <td>${lecturer.name}</td>
                            <td>${lecturer.department}</td>
                            <td><span class="status ${lecturer.status.toLowerCase()}">${lecturer.status}</span></td>
                            <td>${lecturer.lastSeen}</td>
                        </tr>`;
            overviewBody.innerHTML += row;
        });
    }

    // --- Sidebar Toggle Functionality (reusable) ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
         // Ensure sidebar starts collapsed on smaller screens if not already handled by CSS
        if (window.innerWidth <= 768 && !sidebar.classList.contains('active')) {
            sidebar.classList.add('collapsed'); // Or use the logic to ensure it's hidden
        } else if (window.innerWidth > 768) {
            sidebar.classList.remove('collapsed');
        }
    }
     // Adjust sidebar on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('collapsed');
            sidebar.classList.remove('active'); // Desktop view typically doesn't need active toggle state
        } else {
            if (!sidebar.classList.contains('active')) { // If it wasn't explicitly opened, keep it collapsed
                 sidebar.classList.add('collapsed');
            }
        }
    });


    // --- Logout Button Handler (Placeholder) ---
    // const logoutBtn = document.getElementById('logoutBtn');
    // if (logoutBtn) {
    //     logoutBtn.addEventListener('click', (e) => {
    //         e.preventDefault();
    //         alert('Admin logging out...');
    //         // Add your actual logout logic here
    //         // window.location.href = '/admin/logout-endpoint';
    //     });
    // }
});