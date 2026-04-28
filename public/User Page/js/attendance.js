// Attendance Page JavaScript Functionality

class AttendanceManager {    constructor() {
        this.modal = document.getElementById('correctionModal');
        this.correctionForm = document.getElementById('correctionForm');
        this.monthFilter = document.getElementById('monthFilter');
        this.attendanceTable = document.querySelector('.attendance-table tbody');
        this.timeInBtn = document.querySelector('.time-in');
        this.timeOutBtn = document.querySelector('.time-out');
        
        // Get time value elements more specifically
        const timeCards = document.querySelectorAll('.time-card');
        this.todayTimeIn = timeCards[0]?.querySelector('.time-value'); // First card - Time In
        this.todayStatus = timeCards[1]?.querySelector('.status-badge'); // Second card - Status
        this.todayTimeOut = timeCards[2]?.querySelector('.time-value'); // Third card - Time Out
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMonthFilter();
        this.loadTodayAttendance();
        this.loadAttendanceHistory();
    }    setupEventListeners() {
        // Modal controls
        const openModalBtn = document.querySelector('.request-correction-btn');
        const closeModalBtn = document.querySelector('.close-modal');
        
        openModalBtn.addEventListener('click', () => this.openModal());
        closeModalBtn.addEventListener('click', () => this.closeModal());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Form submission
        this.correctionForm.addEventListener('submit', (e) => this.handleCorrectionSubmit(e));
        
        // Month filter
        this.monthFilter.addEventListener('change', () => this.loadAttendanceHistory());
        
        // Time in/out buttons
        this.timeInBtn.addEventListener('click', () => this.handleTimeIn());
        this.timeOutBtn.addEventListener('click', () => this.handleTimeOut());
    }    setupMonthFilter() {
        // Clear existing options
        this.monthFilter.innerHTML = '';
        
        // Get current date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Current month
        const currentOption = document.createElement('option');
        currentOption.value = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        currentOption.textContent = `${this.getMonthName(currentMonth)} ${currentYear}`;
        currentOption.selected = true;
        this.monthFilter.appendChild(currentOption);
        
        // Last month
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const lastOption = document.createElement('option');
        lastOption.value = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}`;
        lastOption.textContent = `${this.getMonthName(lastMonth)} ${lastMonthYear}`;
        this.monthFilter.appendChild(lastOption);
        
        // Previous month
        const prevMonth = lastMonth === 0 ? 11 : lastMonth - 1;
        const prevMonthYear = lastMonth === 0 ? lastMonthYear - 1 : lastMonthYear;
        const prevOption = document.createElement('option');
        prevOption.value = `${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}`;
        prevOption.textContent = `${this.getMonthName(prevMonth)} ${prevMonthYear}`;
        this.monthFilter.appendChild(prevOption);
    }
    
    getMonthName(monthIndex) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthIndex];
    }
    
    openModal() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('correctionDate').value = today;
    }
    
    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.correctionForm.reset();
    }
    
    async handleCorrectionSubmit(e) {
        e.preventDefault();
        
        const formData = {
            date: document.getElementById('correctionDate').value,
            correction_type: document.getElementById('correctionType').value,
            time_in: document.getElementById('correctTimeIn').value,
            time_out: document.getElementById('correctTimeOut').value,
            reason: document.getElementById('reason').value
        };
        
        try {
            const response = await fetch('../handlers/attendance_correction_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Correction request submitted successfully!');
                this.closeModal();
            } else {
                this.showError(result.error || 'Failed to submit correction request');
            }
        } catch (error) {
            console.error('Error submitting correction:', error);
            this.showError('Network error. Please try again.');
        }
    }      async loadTodayAttendance() {
        // Try to reinitialize elements if they weren't found initially
        this.reinitializeElements();
        
        try {
            // Add cache-busting parameter and a timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`../handlers/attendance_handler.php?t=${new Date().getTime()}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                
                // Try to get more detailed error information
                try {
                    const errorText = await response.text();
                    console.error('Error response:', errorText);
                } catch (textError) {
                    console.error('Could not read error response text');
                }
                
                throw new Error(`HTTP error! status: ${response.status}`);
            }
              const result = await response.json();
            
            console.log('Backend response:', result); // Debug: Log the entire response
            
            if (result.success) {
                const today = result.today;
                
                console.log('Today\'s data:', today); // Debug: Log today's attendance data
                
                // Debug: Check if elements exist
                console.log('Time elements found:', {
                    timeIn: !!this.todayTimeIn,
                    timeOut: !!this.todayTimeOut,
                    status: !!this.todayStatus,
                    timeInBtn: !!this.timeInBtn,
                    timeOutBtn: !!this.timeOutBtn
                });
                
                if (today) {
                    console.log('Time in value:', today.time_in); // Debug: Log time_in value
                    console.log('Time out value:', today.time_out); // Debug: Log time_out value
                    console.log('Status value:', today.status); // Debug: Log status value
                    
                    // Update time in display
                    if (today.time_in) {
                        const formattedTimeIn = this.formatTime(today.time_in);
                        console.log('Formatted time in:', formattedTimeIn); // Debug: Log formatted time
                        if (this.todayTimeIn) {
                            this.todayTimeIn.textContent = formattedTimeIn;
                        }
                        if (this.timeInBtn) {
                            this.timeInBtn.disabled = true;
                            this.timeInBtn.textContent = 'Already Timed In';
                            this.timeInBtn.style.backgroundColor = '#6B7280';
                        }
                    } else {
                        if (this.todayTimeIn) {
                            this.todayTimeIn.textContent = '--:--';
                        }
                        if (this.timeInBtn) {
                            this.timeInBtn.disabled = false;
                            this.timeInBtn.textContent = 'Time In';
                            this.timeInBtn.style.backgroundColor = '#2C6159';
                        }
                    }
                    
                    // Update time out display
                    if (today.time_out) {
                        const formattedTimeOut = this.formatTime(today.time_out);
                        console.log('Formatted time out:', formattedTimeOut); // Debug: Log formatted time
                        if (this.todayTimeOut) {
                            this.todayTimeOut.textContent = formattedTimeOut;
                        }
                        if (this.timeOutBtn) {
                            this.timeOutBtn.disabled = true;
                            this.timeOutBtn.textContent = 'Already Timed Out';
                            this.timeOutBtn.style.backgroundColor = '#6B7280';
                        }
                    } else {
                        if (this.todayTimeOut) {
                            this.todayTimeOut.textContent = '--:--';
                        }
                        if (this.timeOutBtn) {
                            this.timeOutBtn.disabled = !today.time_in;
                            if (today.time_in) {
                                this.timeOutBtn.textContent = 'Time Out';
                                this.timeOutBtn.style.backgroundColor = '#2C6159';
                            } else {
                                this.timeOutBtn.textContent = 'Time Out';
                                this.timeOutBtn.style.backgroundColor = '#6B7280';
                            }
                        }
                    }
                    
                    // Update status
                    if (this.todayStatus) {
                        if (today.status) {
                            this.todayStatus.textContent = this.getStatusText(today.status);
                            this.todayStatus.className = `status-badge ${this.getStatusClass(today.status)}`;
                        } else {
                            this.todayStatus.textContent = 'No Record';
                            this.todayStatus.className = 'status-badge absent';
                        }
                    }
                } else {
                    console.log('No attendance record for today'); // Debug: Log when no record
                    // No attendance record for today
                    if (this.todayTimeIn) {
                        this.todayTimeIn.textContent = '--:--';
                    }
                    if (this.todayTimeOut) {
                        this.todayTimeOut.textContent = '--:--';
                    }
                    if (this.todayStatus) {
                        this.todayStatus.textContent = 'Not Checked In';
                        this.todayStatus.className = 'status-badge absent';
                    }
                    
                    if (this.timeInBtn) {
                        this.timeInBtn.disabled = false;
                        this.timeInBtn.textContent = 'Time In';
                        this.timeInBtn.style.backgroundColor = '#2C6159';
                    }
                    
                    if (this.timeOutBtn) {
                        this.timeOutBtn.disabled = true;
                        this.timeOutBtn.textContent = 'Time Out';
                        this.timeOutBtn.style.backgroundColor = '#6B7280';
                    }
                }
            } else {
                console.error('Server error:', result);
                this.showError(result.error || 'Failed to load today\'s attendance');
            }
        } catch (error) {
            console.error('Error loading today\'s attendance:', error);
            this.showError('Error loading today\'s attendance. Please refresh the page.');
            
            // Set default values for UI elements
            this.setDefaultAttendanceValues();
        }
    }
    
    // New method to set default values when there's an error
    setDefaultAttendanceValues() {
        if (this.todayTimeIn) {
            this.todayTimeIn.textContent = '--:--';
        }
        if (this.todayTimeOut) {
            this.todayTimeOut.textContent = '--:--';
        }
        if (this.todayStatus) {
            this.todayStatus.textContent = 'Error';
            this.todayStatus.className = 'status-badge absent';
        }
        
        if (this.timeInBtn) {
            this.timeInBtn.disabled = false;
            this.timeInBtn.textContent = 'Time In';
            this.timeInBtn.style.backgroundColor = '#2C6159';
        }
        
        if (this.timeOutBtn) {
            this.timeOutBtn.disabled = true;
            this.timeOutBtn.textContent = 'Time Out';
            this.timeOutBtn.style.backgroundColor = '#6B7280';
        }
    }
      
      formatTime(timeString) {
        console.log('formatTime input:', timeString); // Debug: Log input
        
        if (!timeString) {
            console.log('No time string provided');
            return '--:--';
        }
        
        try {
            let time;
            
            // Handle different time formats
            if (timeString.includes(' ')) {
                // Full datetime format: "2024-12-15 08:30:00"
                time = new Date(timeString);
            } else if (timeString.includes(':')) {
                // Time only format: "08:30:00" or "08:30"
                time = new Date(`2000-01-01 ${timeString}`);
            } else {
                console.log('Unknown time format:', timeString);
                return timeString;
            }
            
            if (isNaN(time.getTime())) {
                console.log('Invalid date created from:', timeString);
                return timeString;
            }
            
            const formatted = time.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            
            console.log('formatTime output:', formatted); // Debug: Log output
            return formatted;
        } catch (error) {
            console.error('Error formatting time:', error, 'Input:', timeString);
            return timeString;
        }
    }
      async loadAttendanceHistory() {
        const selectedMonth = this.monthFilter.value;
        
        // Show loading state
        this.attendanceTable.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Loading attendance records...</td></tr>';
        
        try {
            // Add timeout and cache-busting parameter
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`../handlers/attendance_handler.php?month=${selectedMonth}&t=${new Date().getTime()}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                // Try to get more detailed error information
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorText = await response.text();
                    console.error('Error response:', errorText);
                    errorMessage += ` - ${errorText}`;
                } catch (textError) {
                    console.error('Could not read error response text');
                }
                
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
              if (result.success) {
                this.updateAttendanceTable(result.attendance);
                
                // Update page title to show current employee and month
                const monthName = this.getMonthName(parseInt(selectedMonth.split('-')[1]) - 1);
                const year = selectedMonth.split('-')[0];
                document.querySelector('.page-title h1').textContent = `My Attendance - ${monthName} ${year}`;
                
            } else {
                console.error('Error from server:', result);
                this.showError(result.error || 'Failed to load attendance history');
                this.attendanceTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #EF4444; padding: 20px;">Error loading attendance records</td></tr>';
            }
        } catch (error) {
            console.error('Network error loading attendance history:', error);
            this.showError('Network error. Please check your connection and try again.');
            this.attendanceTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #EF4444; padding: 20px;">Network error loading records</td></tr>';
        }
    }
      updateAttendanceTable(attendanceData) {
        this.attendanceTable.innerHTML = '';
        
        if (!attendanceData || attendanceData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" style="text-align: center; color: #6B7280; padding: 40px;">No attendance records found for this month</td>';
            this.attendanceTable.appendChild(row);
            return;
        }
        
        attendanceData.forEach(record => {
            const row = document.createElement('tr');
            
            // Format status badge with proper classes
            const statusClass = this.getStatusClass(record.status);
            const statusText = this.getStatusText(record.status);
            
            row.innerHTML = `
                <td>${this.formatDate(record.date)}</td>
                <td>${record.time_in || '-'}</td>
                <td>${record.time_out || '-'}</td>
                <td>${record.total_hours || '0:00'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            `;
            this.attendanceTable.appendChild(row);
        });
    }
    
    getStatusClass(status) {
        switch(status) {
            case 'present': return 'present';
            case 'late': return 'late';
            case 'absent': return 'absent';
            case 'undertime': return 'undertime';
            default: return 'present';
        }
    }
    
    getStatusText(status) {
        switch(status) {
            case 'present': return 'Present';
            case 'late': return 'Late';
            case 'absent': return 'Absent';
            case 'undertime': return 'Undertime';
            default: return 'Present';
        }
    }    async handleTimeIn() {        
        try {
            const response = await fetch('../handlers/attendance_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'time_in' })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(result.message);

                // Directly update the UI with the response
                if (this.todayTimeIn) {
                    this.todayTimeIn.textContent = result.time_in;
                }
                if (this.todayStatus) {
                    this.todayStatus.textContent = this.getStatusText(result.status);
                    this.todayStatus.className = `status-badge ${this.getStatusClass(result.status)}`;
                }
                if (this.timeInBtn) {
                    this.timeInBtn.disabled = true;
                    this.timeInBtn.textContent = 'Already Timed In';
                    this.timeInBtn.style.backgroundColor = '#6B7280';
                }
                if (this.timeOutBtn) {
                    this.timeOutBtn.disabled = false;
                    this.timeOutBtn.style.backgroundColor = '#2C6159';
                }

                // Reload history
                this.loadAttendanceHistory();
            } else {
                this.showError(result.error || 'Failed to record time in');
            }
        } catch (error) {
            console.error('Error recording time in:', error);
            this.showError('Network error. Please try again.');
        }
    }
    
    async handleTimeOut() {        
        try {
            const response = await fetch('../handlers/attendance_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'time_out' })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(result.message);

                // Directly update the UI
                if (this.todayTimeOut) {
                    this.todayTimeOut.textContent = result.time_out;
                }
                if (this.todayStatus) {
                    this.todayStatus.textContent = this.getStatusText(result.status);
                    this.todayStatus.className = `status-badge ${this.getStatusClass(result.status)}`;
                }
                if (this.timeOutBtn) {
                    this.timeOutBtn.disabled = true;
                    this.timeOutBtn.textContent = 'Already Timed Out';
                    this.timeOutBtn.style.backgroundColor = '#6B7280';
                }

                // Reload history
                this.loadAttendanceHistory();
            } else {
                this.showError(result.error || 'Failed to record time out');
            }
        } catch (error) {
            console.error('Error recording time out:', error);
            this.showError('Network error. Please try again.');
        }
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    showSuccess(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <div class="toast-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <div class="toast-content">
                <p>${message}</p>
            </div>
            <button class="toast-close">×</button>
        `;
        
        document.body.appendChild(toast);
        
        // Add active class after a short delay (for animation)
        setTimeout(() => {
            toast.classList.add('active');
        }, 10);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => {
                toast.remove();
            }, 300); // Wait for fade out animation
        }, 5000);
        
        // Close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('active');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    }
    
    showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <div class="toast-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            </div>
            <div class="toast-content">
                <p>${message}</p>
            </div>
            <button class="toast-close">×</button>
        `;
        
        document.body.appendChild(toast);
        
        // Add active class after a short delay (for animation)
        setTimeout(() => {
            toast.classList.add('active');
        }, 10);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => {
                toast.remove();
            }, 300); // Wait for fade out animation
        }, 5000);
        
        // Close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('active');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    }
    
    reinitializeElements() {
        // Try to find elements again if they weren't found initially
        if (!this.todayTimeIn || !this.todayTimeOut || !this.todayStatus) {
            const timeCards = document.querySelectorAll('.time-card');
            if (timeCards.length >= 3) {
                this.todayTimeIn = this.todayTimeIn || timeCards[0]?.querySelector('.time-value');
                this.todayStatus = this.todayStatus || timeCards[1]?.querySelector('.status-badge');
                this.todayTimeOut = this.todayTimeOut || timeCards[2]?.querySelector('.time-value');
            }
        }
        
        if (!this.timeInBtn) {
            this.timeInBtn = document.querySelector('.time-in');
        }
        
        if (!this.timeOutBtn) {
            this.timeOutBtn = document.querySelector('.time-out');
        }
        
        if (!this.attendanceTable) {
            this.attendanceTable = document.querySelector('.attendance-table tbody');
        }
    }
}

// Initialize the attendance manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const attendanceManager = new AttendanceManager();

    const timeInBtn = document.getElementById('time-in-btn');
    const timeOutBtn = document.getElementById('time-out-btn');
    const timeInTimeEl = document.querySelector('.time-in-time');
    const timeOutTimeEl = document.querySelector('.time-out-time');
    const statusTextEl = document.querySelector('.status-text');

    function fetchAttendanceData() {
        // Mocked data - User has already timed in and out for today
        const mockData = {
            success: true,
            time_in: "07:58:10",
            time_out: "17:02:30",
            status: "Completed"
        };

        if (mockData.success) {
            if (mockData.time_in) {
                timeInTimeEl.textContent = formatTime(mockData.time_in);
                timeInBtn.disabled = true;
                timeInBtn.textContent = 'TIMED IN';
                timeInBtn.style.backgroundColor = '#ccc';
            } else {
                timeInTimeEl.textContent = '--:--';
                timeInBtn.disabled = false;
            }

            if (mockData.time_out) {
                timeOutTimeEl.textContent = formatTime(mockData.time_out);
                timeOutBtn.disabled = true;
                timeOutBtn.textContent = 'TIMED OUT';
                timeOutBtn.style.backgroundColor = '#ccc';
            } else {
                timeOutTimeEl.textContent = '--:--';
                // Enable time-out only if timed-in
                timeOutBtn.disabled = !mockData.time_in;
            }
            
            statusTextEl.textContent = mockData.status || 'Pending';
            if(mockData.status === 'Completed') {
                statusTextEl.style.color = '#28a745';
            }

        } else {
            console.error('Failed to fetch attendance data');
            timeInTimeEl.textContent = '--:--';
            timeOutTimeEl.textContent = '--:--';
            statusTextEl.textContent = 'Error';
            statusTextEl.style.color = '#dc3545';
        }
    }

    function updateAttendanceHistory() {
        const tbody = document.getElementById('attendance-history-table').querySelector('tbody');
        tbody.innerHTML = ''; // Clear existing rows

        const mockHistory = generateMockHistory();
        
        if (mockHistory.length > 0) {
            mockHistory.forEach(record => {
                const row = document.createElement('tr');
                
                let statusClass = '';
                if (record.status === 'On Time') statusClass = 'status-on-time';
                else if (record.status === 'Late') statusClass = 'status-late';
                else if (record.status === 'Undertime') statusClass = 'status-undertime';
                else if (record.status === 'Absent') statusClass = 'status-absent';


                row.innerHTML = `
                    <td>${record.date}</td>
                    <td>${record.day}</td>
                    <td>${record.time_in || '--:--'}</td>
                    <td>${record.time_out || '--:--'}</td>
                    <td>${record.total_hours || '0h 0m'}</td>
                    <td><span class="status ${statusClass}">${record.status}</span></td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6">No attendance records found.</td></tr>';
        }
    }

    function generateMockHistory() {
        const history = [];
        const today = new Date('2025-06-26'); // Set fixed date for consistency
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Generate for current month (up to today)
        for (let i = 1; i <= today.getDate(); i++) {
            const date = new Date(currentYear, currentMonth, i);
            if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends
            history.push(createRecord(date));
        }

        // Generate for previous month
        const prevMonth = currentMonth - 1;
        const daysInPrevMonth = new Date(currentYear, prevMonth + 1, 0).getDate();
        for (let i = 1; i <= daysInPrevMonth; i++) {
            const date = new Date(currentYear, prevMonth, i);
            if (date.getDay() === 0 || date.getDay() === 6) continue;
             history.push(createRecord(date));
        }
        
        return history.reverse(); // Show most recent first
    }

    function createRecord(date) {
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

        // Make some days absent
        if (Math.random() < 0.05) {
             return {
                date: formattedDate,
                day: day,
                time_in: null,
                time_out: null,
                total_hours: '0h 0m',
                status: 'Absent'
            };
        }

        const timeInHour = 7 + Math.floor(Math.random() * 2); // 7-8 AM
        const timeInMinute = Math.floor(Math.random() * 60);
        const timeIn = new Date(date);
        timeIn.setHours(timeInHour, timeInMinute);

        const timeOutHour = 17 + Math.floor(Math.random() * 2); // 5-6 PM
        const timeOutMinute = Math.floor(Math.random() * 60);
        const timeOut = new Date(date);
        timeOut.setHours(timeOutHour, timeOutMinute);
        
        const totalMs = timeOut - timeIn;
        const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
        const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

        let status = 'On Time';
        if (timeInHour > 8 || (timeInHour === 8 && timeInMinute > 0)) {
            status = 'Late';
        } else if (totalHours < 8) {
            status = 'Undertime';
        }

        return {
            date: formattedDate,
            day: day,
            time_in: timeIn.toLocaleTimeString('en-US', { hour12: false }),
            time_out: timeOut.toLocaleTimeString('en-US', { hour12: false }),
            total_hours: `${totalHours}h ${totalMinutes}m`,
            status: status
        };
    }

    function formatTime(timeString) {
        if (!timeString) return '--:--';
        const [h, m] = timeString.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${m} ${ampm}`;
    }

    timeInBtn.addEventListener('click', () => {
        // This would normally send a request to the server
        alert("This is a mock action. In a real scenario, this would record your time-in.");
    });

    timeOutBtn.addEventListener('click', () => {
        // This would normally send a request to the server
        alert("This is a mock action. In a real scenario, this would record your time-out.");
    });

    // Initial data load
    fetchAttendanceData();
    updateAttendanceHistory();
});
