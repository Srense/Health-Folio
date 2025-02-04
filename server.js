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


let users = [];


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


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

// setting the Session
app.use(session({
    secret: 'Rizwan@1122', 
    resave: false,
    saveUninitialized: true
}));

//mapping part
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


app.get('/:page', (req, res) => {
    const page = req.params.page;
    const targetPage = pageMappings[page] || 'index.html'; 
    res.sendFile(path.join(__dirname, 'public', targetPage));
});


app.get('/test-details/:testName', (req, res) => {
    const testName = req.params.testName;
    res.redirect(`/Doctors1.html?testName=${testName}`);
});


app.get('/api/doctors/:id', (req, res) => {
    const doctorId = parseInt(req.params.id);
    const doctor = doctors.find(d => d.id === doctorId);

    if (doctor) {
        res.json(doctor);
    } else {
        res.status(404).json({ message: 'Doctor not found' });
    }
});


app.post('/api/book-now-form', (req, res) => {
    const { firstName, lastName, address, phone, email, doctorName, appointmentDate, timeSlot } = req.body;

   
    const paymentUrl = `https://api.qrserver.com/v1/create-qr-code/?data=upi://pay?pa=9631484236@ptaxis&pn=Sohel%20Rizwan&mc=0000&mode=02&purpose=00&orgid=159761&cust=1405135095&size=200x200`;

    
    res.json({ paymentUrl });
});


app.post('/api/payment-confirmation', (req, res) => {
    const { email, doctorName, appointmentDate, timeSlot } = req.body;

    
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


app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
   
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

   
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

 
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    res.json({ message: 'Account created successfully' });
});


app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

   
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

   
    const user = users.find(user => user.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
        
        req.session.user = user;
        res.json({ message: 'Login successful', user });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
});


app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.json({ message: 'Logout successful' });
    });
});


app.post('/saveTask', async (req, res) => {
    const { username, task, priority } = req.body;
    const status = 'Pending'; 

    if (!username || !task || !priority) {
        return res.status(400).json({ message: 'Username, task, and priority are required' });
    }

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelFilePath);
        const worksheet = workbook.getWorksheet('Tasks');

        
        worksheet.addRow({ username, task, priority, status });
        await workbook.xlsx.writeFile(excelFilePath);

        res.json({ message: 'Task saved successfully' });
    } catch (error) {
        console.error('Error saving task:', error.message);
        res.status(500).json({ message: `Error saving task: ${error.message}` });
    }
});


// Starting the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
