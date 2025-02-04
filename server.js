const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const ExcelJS = require('exceljs');
const session = require('express-session');

const app = express();
const port = 3000;

// Sample data for doctors
const doctors = [
    {
        id: 1,
        name: 'Dr. John Doe',
        specialty: 'Cardiologist',
        availableDates: ['2024-08-15', '2024-08-16'],
        timeSlots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM']
    },
    {
        id: 2,
        name: 'Dr. Jane Smith',
        specialty: 'Dermatologist',
        availableDates: ['2024-08-17', '2024-08-18'],
        timeSlots: ['11:00 AM - 12:00 PM', '01:00 PM - 02:00 PM']
    },
    {
        id: 3,
        name: 'Dr. Emily Davis',
        specialty: 'Pediatrician',
        availableDates: ['2024-08-19', '2024-08-20'],
        timeSlots: ['09:00 AM - 10:00 AM', '03:00 PM - 04:00 PM']
    },
    {
        id: 4,
        name: 'Dr. Michael Brown',
        specialty: 'Orthopedic Surgeon',
        availableDates: ['2024-08-21', '2024-08-22'],
        timeSlots: ['10:00 AM - 11:00 AM', '02:00 PM - 03:00 PM']
    },
    {
        id: 5,
        name: 'Dr. Lisa Johnson',
        specialty: 'Gynecologist',
        availableDates: ['2024-08-23', '2024-08-24'],
        timeSlots: ['08:00 AM - 09:00 AM', '01:00 PM - 02:00 PM']
    },
    {
        id: 6,
        name: 'Dr. William Lee',
        specialty: 'Neurologist',
        availableDates: ['2024-08-25', '2024-08-26'],
        timeSlots: ['09:00 AM - 10:00 AM', '02:00 PM - 03:00 PM']
    },
    {
        id: 7,
        name: 'Dr. Olivia Martinez',
        specialty: 'Endocrinologist',
        availableDates: ['2024-08-27', '2024-08-28'],
        timeSlots: ['10:00 AM - 11:00 AM', '03:00 PM - 04:00 PM']
    },
    {
        id: 8,
        name: 'Dr. James Wilson',
        specialty: 'Oncologist',
        availableDates: ['2024-08-29', '2024-08-30'],
        timeSlots: ['08:00 AM - 09:00 AM', '12:00 PM - 01:00 PM']
    }
];

// In-memory storage for users (for demonstration; use a database in production)
let users = [];

// Setup Excel file for tasks if it doesn't exist
const excelFilePath = path.join(__dirname, 'tasks.xlsx');
const initializeExcelFile = async () => {
    if (!fs.existsSync(excelFilePath)) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tasks');
        worksheet.columns = [
            { header: 'Username', key: 'username' },
            { header: 'Task Description', key: 'task' },
            { header: 'Priority', key: 'priority' },
            { header: 'Status', key: 'status' }
        ];
        await workbook.xlsx.writeFile(excelFilePath);
    }
};
initializeExcelFile();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
app.use(session({
    secret: 'Rizwan@1122', // Replace with a secure random key
    resave: false,
    saveUninitialized: true
}));

// Define a mapping of pages to HTML files
const pageMappings = {
    'Home': 'index.html',
    'AboutUs': 'about.html',
    'Services': 'services.html',
    'ContactUs': 'contact.html',
    'Laboratory': 'Laboratory.html',
    'HealthCheck': 'HealthCheck.html',
    'GeneralDentistry': 'GeneralDentistry.html',
    'PrimaryCare': 'PrimaryCare.html',
    'Book': 'Book.html'
};

// Route to handle page navigation
app.get('/:page', (req, res) => {
    const page = req.params.page;
    const targetPage = pageMappings[page] || 'index.html'; // Fallback to index.html if no match
    res.sendFile(path.join(__dirname, 'public', targetPage));
});

// Route to handle specific test details (optional)
app.get('/test-details/:testName', (req, res) => {
    const testName = req.params.testName;
    res.redirect(`/Doctors1.html?testName=${testName}`);
});

// Route to get doctor data by ID
app.get('/api/doctors/:id', (req, res) => {
    const doctorId = parseInt(req.params.id);
    const doctor = doctors.find(d => d.id === doctorId);

    if (doctor) {
        res.json(doctor);
    } else {
        res.status(404).json({ message: 'Doctor not found' });
    }
});

// Route to handle appointment booking
app.post('/api/book-now-form', (req, res) => {
    const { firstName, lastName, address, phone, email, doctorName, appointmentDate, timeSlot } = req.body;

    // Generate a payment URL (example URL; replace with your actual payment URL)
    const paymentUrl = `https://api.qrserver.com/v1/create-qr-code/?data=upi://pay?pa=9631484236@ptaxis&pn=Sohel%20Rizwan&mc=0000&mode=02&purpose=00&orgid=159761&cust=1405135095&size=200x200`;

    // Respond with the payment URL
    res.json({ paymentUrl });
});

// Route to handle payment confirmation
app.post('/api/payment-confirmation', (req, res) => {
    const { email, doctorName, appointmentDate, timeSlot } = req.body;

    // Create transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'sohelrizwan36@gmail.com',
            pass: 'lycghgqwnahjkdnz'
        }
    });

    const mailOptions = {
        from: 'sohelrizwan36@gmail.com',
        to: email,
        subject: 'Appointment Confirmation and Payment Receipt',
        text: `Your appointment has been booked with ${doctorName} at ${timeSlot} on ${appointmentDate}.
               The payment has been received successfully. Thank you for choosing our service.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error.message);
            res.status(500).json({ message: `Error sending email: ${error.message}` });
        } else {
            console.log('Email sent:', info.response);
            res.json({ message: 'Appointment booked successfully. A confirmation email has been sent.' });
        }
    });
});

// Route to handle user sign-up
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    // Simple validation (add more robust checks in production)
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password and save user data
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    res.json({ message: 'Account created successfully' });
});

// Route to handle user login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    // Simple validation (add more robust checks in production)
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if user exists and password matches
    const user = users.find(user => user.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
        // Set session
        req.session.user = user;
        res.json({ message: 'Login successful', user });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
});

// Route to handle user logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Route to save task to Excel
app.post('/saveTask', async (req, res) => {
    const { username, task, priority } = req.body;
    const status = 'Pending'; // Default status

    if (!username || !task || !priority) {
        return res.status(400).json({ message: 'Username, task, and priority are required' });
    }

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelFilePath);
        const worksheet = workbook.getWorksheet('Tasks');

        // Add new task to worksheet
        worksheet.addRow({ username, task, priority, status });
        await workbook.xlsx.writeFile(excelFilePath);

        res.json({ message: 'Task saved successfully' });
    } catch (error) {
        console.error('Error saving task:', error.message);
        res.status(500).json({ message: `Error saving task: ${error.message}` });
    }
});


// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
